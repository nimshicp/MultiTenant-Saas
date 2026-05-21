import logging
from datetime import timedelta
from celery import shared_task

from django.conf import settings
from django.core.mail import send_mail
from django.utils.timezone import now
from django.contrib.auth import get_user_model

# django-tenants tracking helpers
from django_tenants.utils import tenant_context
from customers.models import Tenant  

from employee.models import Role 

from .models import (
    Task,
    Project,
    TaskStatus,
    ProjectStatus,
    Priority
)

logger = logging.getLogger(__name__)
User = get_user_model()


def _get_display_name(user):
    """
    Safely builds a display name fallback since 'username' is explicitly dropped (None)
    on our Custom User model. Looks at UserProfile first, then drops back to email.
    """
    if not user:
        return "Team Member"
    if hasattr(user, 'profile') and user.profile.full_name:
        return user.profile.full_name
    return user.email.split('@')[0]


# ==========================================================
# 1. TEAM MEMBER TASK DEADLINE REMINDERS
# ==========================================================
@shared_task(
    name="projects.tasks.send_task_deadline_reminders",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3
)
def send_task_deadline_reminders(self):
    tomorrow = now().date() + timedelta(days=1)
    tenants = Tenant.objects.exclude(schema_name='public')
    total_sent = 0

    for tenant in tenants:
        with tenant_context(tenant):
            tasks = Task.objects.filter(
                due_date=tomorrow
            ).exclude(
                status__in=[TaskStatus.DONE, TaskStatus.OVERDUE]
            ).select_related('assigned_to', 'assigned_to__profile', 'project').iterator(chunk_size=1000)

            for task in tasks:
                if not task.assigned_to or not task.assigned_to.email:
                    continue

                display_name = _get_display_name(task.assigned_to)

                send_mail(
                    subject=f"[{tenant.name.upper()}] Task Deadline Reminder",
                    message=f"""Hello {display_name},

Reminder:
Your task "{task.title}" deadline is tomorrow.

Project: {task.project.name}
Task Priority: {task.get_priority_display()}
Current Status: {task.get_status_display()}

Please complete the task before the deadline.

Thank you.""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[task.assigned_to.email],
                    fail_silently=False
                )
                total_sent += 1

    return f"Dispatched {total_sent} task deadline reminders across tenants."


# ==========================================================
# 2. AUTO UPDATE OVERDUE TASKS
# ==========================================================
@shared_task(
    name="projects.tasks.update_overdue_tasks",
    queue="default",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3
)
def update_overdue_tasks(self):
    today = now().date()
    tenants = Tenant.objects.exclude(schema_name='public')
    total_updated = 0

    for tenant in tenants:
        with tenant_context(tenant):
            overdue_tasks = Task.objects.filter(
                due_date__lt=today
            ).exclude(
                status__in=[TaskStatus.DONE, TaskStatus.OVERDUE]
            )
            
            count = overdue_tasks.update(status=TaskStatus.OVERDUE)
            total_updated += count

    return f"Marked {total_updated} tasks as OVERDUE across tenant schemas."


# ==========================================================
# 3. PROJECT MANAGER DEADLINE REMINDERS
# ==========================================================
@shared_task(
    name="projects.tasks.send_project_deadline_reminders",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3
)
def send_project_deadline_reminders(self):
    tomorrow = now().date() + timedelta(days=1)
    tenants = Tenant.objects.exclude(schema_name='public')
    total_sent = 0

    for tenant in tenants:
        with tenant_context(tenant):
            projects = Project.objects.filter(
                deadline=tomorrow
            ).exclude(
                status__in=[
                    ProjectStatus.COMPLETED,
                    ProjectStatus.CANCELLED,
                    ProjectStatus.OVERDUE
                ]
            ).select_related('project_manager', 'project_manager__profile').iterator(chunk_size=1000)

            for project in projects:
                if not project.project_manager or not project.project_manager.email:
                    continue

                display_name = _get_display_name(project.project_manager)

                send_mail(
                    subject=f"[{tenant.name.upper()}] Project Deadline Reminder",
                    message=f"""Hello {display_name},

Reminder:
The project "{project.name}" deadline is tomorrow.

Priority: {project.get_priority_display()}
Progress: {project.progress_percentage}%
Current Status: {project.get_status_display()}

Please review all pending tasks and project progress.

Thank you.""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[project.project_manager.email],
                    fail_silently=False
                )
                total_sent += 1

    return f"Emailed {total_sent} project managers across workspace environments."


# ==========================================================
# 4. AUTO UPDATE OVERDUE PROJECTS
# ==========================================================
@shared_task(
    name="projects.tasks.update_overdue_projects",
    queue="default",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3
)
def update_overdue_projects(self):
    today = now().date()
    tenants = Tenant.objects.exclude(schema_name='public')
    total_updated = 0

    for tenant in tenants:
        with tenant_context(tenant):
            overdue_projects = Project.objects.filter(
                deadline__lt=today
            ).exclude(
                status__in=[
                    ProjectStatus.COMPLETED,
                    ProjectStatus.CANCELLED,
                    ProjectStatus.OVERDUE
                ]
            )
            
            count = overdue_projects.update(status=ProjectStatus.OVERDUE)
            total_updated += count

    return f"Marked {total_updated} projects as OVERDUE across tenant schemas."


# ==========================================================
# 5. ADMIN ALERTS FOR HIGH/CRITICAL PROJECTS
# ==========================================================
@shared_task(
    name="projects.tasks.send_admin_project_alerts",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3
)
def send_admin_project_alerts(self):
    tomorrow = now().date() + timedelta(days=1)
    tenants = Tenant.objects.exclude(schema_name='public')
    total_alerts = 0

    for tenant in tenants:
        with tenant_context(tenant):
            projects = Project.objects.filter(
                deadline=tomorrow,
                priority__in=[Priority.HIGH, Priority.CRITICAL]
            ).exclude(
                status__in=[ProjectStatus.COMPLETED, ProjectStatus.CANCELLED]
            )

            if not projects.exists():
                continue

            # Fully type-safe clean lookup leveraging the Role TextChoices object context
            tenant_admins = User.objects.filter(
                employee_profile__tenant=tenant,
                employee_profile__role=Role.ADMIN,  # 👈 Clean reference instead of hardcoded 'ADMIN'
                is_active=True
            ).values_list('email', flat=True)

            admin_emails = [email for email in tenant_admins if email]

            if not admin_emails:
                continue

            project_details = ""
            for project in projects:
                project_details += f"""
--------------------------------------------------
Project Name : {project.name}
Priority     : {project.get_priority_display()}
Status       : {project.get_status_display()}
Progress     : {project.progress_percentage}%
Deadline     : {project.deadline}
"""

            send_mail(
                subject=f"⚠️ URGENT: [{tenant.name.upper()}] High Priority Project Alert",
                message=f"""Workspace Admin Alert,

The following HIGH / CRITICAL projects are still not completed and their deadline is tomorrow.

{project_details}

Please review these projects immediately.

Thank you.""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=False
            )
            total_alerts += len(admin_emails)

    return f"Sent {total_alerts} high-priority system escalation alerts to admins."