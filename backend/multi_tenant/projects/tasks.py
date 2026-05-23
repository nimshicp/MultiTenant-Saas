import logging
from datetime import timedelta

from celery import shared_task

from django.conf import settings
from django.core.mail import send_mail
from django.utils.timezone import now
from django.contrib.auth import get_user_model

from django_tenants.utils import tenant_context
from customers.models import Tenant

from employee.models import Role

from .models import Task, Project, TaskStatus, ProjectStatus, Priority

logger = logging.getLogger(__name__)
User = get_user_model()


def _get_display_name(user):
    if not user:
        return "Team Member"

    if hasattr(user, "profile") and user.profile.full_name:
        return user.profile.full_name

    return user.email.split("@")[0]


# ==========================================================
# 1. TEAM MEMBER TASK DEADLINE REMINDERS
# ==========================================================
@shared_task(
    name="projects.tasks.send_task_deadline_reminders",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_task_deadline_reminders(self):

    tomorrow = now().date() + timedelta(days=1)

    tenants = Tenant.objects.exclude(schema_name="public")

    total_sent = 0

    for tenant in tenants:

        with tenant_context(tenant):

            tasks = (
                Task.objects.filter(due_date=tomorrow)
                .exclude(status__in=[TaskStatus.DONE, TaskStatus.OVERDUE])
                .select_related("assigned_to", "assigned_to__profile", "project")
                .iterator(chunk_size=1000)
            )

            logger.info(f"🔍 [{tenant.schema_name}] Tasks found: {tasks}")

            for task in tasks:

                if not task.assigned_to:
                    logger.warning(f"⚠️ Task '{task.title}' has no assigned user.")
                    continue

                if not task.assigned_to.email:
                    logger.warning(f"⚠️ User has no email for task '{task.title}'.")
                    continue

                display_name = _get_display_name(task.assigned_to)

                try:

                    logger.info(
                        f"✉️ Sending task reminder to: {task.assigned_to.email}"
                    )

                    send_mail(
                        subject=f"[{tenant.name.upper()}] Task Deadline Reminder",
                        message=f"""
Hello {display_name},

Reminder:
Your task "{task.title}" deadline is tomorrow.

Project: {task.project.name}
Task Priority: {task.get_priority_display()}
Current Status: {task.get_status_display()}

Please complete the task before the deadline.

Thank you.
""",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[task.assigned_to.email],
                        fail_silently=False,
                    )

                    total_sent += 1

                    logger.info(
                        f"✓ Email accepted by SMTP for: {task.assigned_to.email}"
                    )

                except Exception as e:

                    logger.error(
                        f"❌ SMTP Error for {task.assigned_to.email}: {str(e)}"
                    )

    return f"Dispatched {total_sent} task reminder emails."


# ==========================================================
# 2. AUTO UPDATE OVERDUE TASKS
# ==========================================================
@shared_task(
    name="projects.tasks.update_overdue_tasks",
    queue="default",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def update_overdue_tasks(self):

    today = now().date()

    tenants = Tenant.objects.exclude(schema_name="public")

    total_updated = 0

    for tenant in tenants:

        with tenant_context(tenant):

            overdue_tasks = Task.objects.filter(due_date__lt=today).exclude(
                status__in=[TaskStatus.DONE, TaskStatus.OVERDUE]
            )

            count = overdue_tasks.update(status=TaskStatus.OVERDUE)

            total_updated += count

    return f"Marked {total_updated} tasks as OVERDUE."


# ==========================================================
# 3. PROJECT MANAGER DEADLINE REMINDERS
# ==========================================================
@shared_task(
    name="projects.tasks.send_project_deadline_reminders",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_project_deadline_reminders(self):

    tomorrow = now().date() + timedelta(days=1)

    tenants = Tenant.objects.exclude(schema_name="public")

    total_sent = 0

    for tenant in tenants:

        with tenant_context(tenant):

            all_projects = Project.objects.filter(deadline=tomorrow)

            logger.info(
                f"🔍 [{tenant.schema_name}] Projects found: {all_projects.count()}"
            )

            projects = (
                all_projects.exclude(
                    status__in=[
                        ProjectStatus.COMPLETED,
                        ProjectStatus.CANCELLED,
                        ProjectStatus.OVERDUE,
                    ]
                )
                .select_related("project_manager", "project_manager__profile")
                .iterator(chunk_size=1000)
            )

            for project in projects:

                if not project.project_manager:
                    logger.warning(f"⚠️ Project '{project.name}' has no manager.")
                    continue

                if not project.project_manager.email:
                    logger.warning(f"⚠️ Manager email missing for '{project.name}'.")
                    continue

                display_name = _get_display_name(project.project_manager)

                try:

                    logger.info(
                        f"✉️ Sending manager reminder to: {project.project_manager.email}"
                    )

                    send_mail(
                        subject=f"[{tenant.name.upper()}] Project Deadline Reminder",
                        message=f"""
Hello {display_name},

Reminder:
The project "{project.name}" deadline is tomorrow.

Priority: {project.get_priority_display()}
Progress: {project.progress_percentage}%
Current Status: {project.get_status_display()}

Please review all pending tasks and project progress.

Thank you.
""",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[project.project_manager.email],
                        fail_silently=False,
                    )

                    total_sent += 1

                    logger.info(
                        f"✓ Email accepted by SMTP for Manager: {project.project_manager.email}"
                    )

                except Exception as e:

                    logger.error(
                        f"❌ SMTP Error for Manager {project.project_manager.email}: {str(e)}"
                    )

    return f"Emailed {total_sent} project managers."


# ==========================================================
# 4. AUTO UPDATE OVERDUE PROJECTS
# ==========================================================
@shared_task(
    name="projects.tasks.update_overdue_projects",
    queue="default",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def update_overdue_projects(self):

    today = now().date()

    tenants = Tenant.objects.exclude(schema_name="public")

    total_updated = 0

    for tenant in tenants:

        with tenant_context(tenant):

            overdue_projects = Project.objects.filter(deadline__lt=today).exclude(
                status__in=[
                    ProjectStatus.COMPLETED,
                    ProjectStatus.CANCELLED,
                    ProjectStatus.OVERDUE,
                ]
            )

            count = overdue_projects.update(status=ProjectStatus.OVERDUE)

            total_updated += count

    return f"Marked {total_updated} projects as OVERDUE."


# ==========================================================
# 5. ADMIN ALERTS
# ==========================================================
@shared_task(
    name="projects.tasks.send_admin_project_alerts",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_admin_project_alerts(self):

    tomorrow = now().date() + timedelta(days=1)

    tenants = Tenant.objects.exclude(schema_name="public")

    total_alerts = 0

    for tenant in tenants:

        with tenant_context(tenant):

            projects = Project.objects.filter(
                deadline=tomorrow, priority__in=[Priority.HIGH, Priority.CRITICAL]
            ).exclude(status__in=[ProjectStatus.COMPLETED, ProjectStatus.CANCELLED])

            if not projects.exists():
                continue

            tenant_admins = User.objects.filter(
                employee_profile__tenant=tenant,
                employee_profile__role=Role.ADMIN,
                is_active=True,
            ).values_list("email", flat=True)

            admin_emails = [email for email in tenant_admins if email]

            if not admin_emails:
                continue

            try:

                send_mail(
                    subject=f"⚠️ URGENT: [{tenant.name.upper()}] High Priority Project Alert",
                    message="High priority project alert.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=False,
                )

                total_alerts += len(admin_emails)

                logger.info(f"✓ Admin alert sent: {admin_emails}")

            except Exception as e:

                logger.error(f"❌ SMTP Error for admin alerts: {str(e)}")

    return f"Sent {total_alerts} admin alerts."
