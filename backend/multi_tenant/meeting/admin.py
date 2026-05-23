from django.contrib import admin

from .models import Meeting


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "organizer",
        "start_time",
        "end_time",
        "status",
    )

    search_fields = (
        "title",
        "organizer__email",
    )

    list_filter = (
        "status",
    )