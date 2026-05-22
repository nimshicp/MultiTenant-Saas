from rest_framework import serializers

from .models import (
    ChatRoom,
    Message
)


class MessageSerializer(
    serializers.ModelSerializer
):

    sender_name =serializers.SerializerMethodField()

    class Meta:

        model = Message

        fields = [

            "id",

            "content",

            "sender",

            "sender_name",

            "created_at",
        ]

    def get_sender_name(
        self,
        obj
    ):

        try:

            return (
                obj.sender
                .profile
                .full_name
            )

        except Exception:

            return obj.sender.email


class ChatRoomSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ChatRoom

        fields = "__all__"