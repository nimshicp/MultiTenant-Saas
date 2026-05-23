from django.urls import path

from .views import (
    CreateMeetingView,
    MeetingListView,
    UpcomingMeetingView,
    MeetingDetailView,
)

urlpatterns = [

    path(
        "create/",
        CreateMeetingView.as_view()
    ),

    path(
        "",
        MeetingListView.as_view()
    ),

    path(
        "upcoming/",
        UpcomingMeetingView.as_view()
    ),

    path(
        "<uuid:meeting_id>/",
        MeetingDetailView.as_view()
    ),
]