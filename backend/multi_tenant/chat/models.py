import uuid

from django.db import models

from django.conf import settings


class ChatRoom(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="chat_user1",
        on_delete=models.CASCADE
    )

    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="chat_user2",
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        unique_together = (
            "user1",
            "user2"
        )


class Message(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    room = models.ForeignKey(
        ChatRoom,
        related_name="messages",
        on_delete=models.CASCADE
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    content = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = ["created_at"]