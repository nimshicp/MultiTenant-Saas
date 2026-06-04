from datetime import timedelta

from celery import shared_task

from django.conf import settings
from django.core.mail import send_mail
from django.utils.timezone import now

from django_tenants.utils import tenant_context

from customers.models import Tenant

from .models import Meeting


@shared_task(
    name="meeting.tasks.send_meeting_reminders",
    queue="emails",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_meeting_reminders(self):

    reminder_window_start = (
        now() + timedelta(minutes=25)
    )

    reminder_window_end = (
        now() + timedelta(minutes=35)
    )

    tenants = Tenant.objects.exclude(
        schema_name="public"
    )

    total_sent = 0

    for tenant in tenants:

        with tenant_context(tenant):

            meetings = Meeting.objects.filter(
                start_time__gte=reminder_window_start,
                start_time__lte=reminder_window_end,
                status="scheduled",
                reminder_sent=False,
            )

            for meeting in meetings:

                emails = list(
                    meeting.participants.values_list(
                        "email",
                        flat=True
                    )
                )

                if not emails:
                    continue

                try:

                    send_mail(
                        subject=f"Meeting Reminder: {meeting.title}",
                        message=f"""
Hello,

This is a reminder that your meeting
"{meeting.title}"
starts in approximately 30 minutes.

Start Time:
{meeting.start_time}

End Time:
{meeting.end_time}

Meeting Link:
{meeting.meeting_link}

Description:
{meeting.description}

Thank you.
                        """,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=emails,
                        fail_silently=False,
                    )

                    meeting.reminder_sent = True

                    meeting.save(
                        update_fields=[
                            "reminder_sent"
                        ]
                    )

                    total_sent += len(emails)

                except Exception as e:

                    print(
                        f"Failed to send reminder "
                        f"for meeting {meeting.id}: {e}"
                    )

    return (
        f"Sent meeting reminders "
        f"to {total_sent} recipients."
    )