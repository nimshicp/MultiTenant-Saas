from django.urls import path

from .views import (
    CreateOrGetChatRoomView,
    ChatMessagesView,
    ChatUsersView
)

urlpatterns = [
    path("users/", ChatUsersView.as_view(), name="chat-users"),

    path(
        "room/",
        CreateOrGetChatRoomView.as_view()
    ),

    path(
        "messages/<uuid:room_id>/",
        ChatMessagesView.as_view()
    ),
]