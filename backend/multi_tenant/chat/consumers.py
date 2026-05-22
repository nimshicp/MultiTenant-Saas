import json

from channels.db import database_sync_to_async

from channels.generic.websocket import AsyncWebsocketConsumer

from .models import ChatRoom, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]

        self.room_group_name = f"chat_{self.room_id}"

        room = await self.get_room()

        user = self.scope["user"]

        # SECURITY CHECK
        if room.user1_id != user.id and room.user2_id != user.id:

            await self.close()

            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):

        data = json.loads(text_data)

        message = data["message"]

        sender = self.scope["user"]

        saved_message = await self.save_message(sender, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message_id": str(saved_message.id),
                "message": saved_message.content,
                "sender_id": str(saved_message.sender.id),
                "sender_name": self.get_sender_name(saved_message.sender),
                "created_at": str(saved_message.created_at),
            },
        )

    async def chat_message(self, event):

        current_user_id = str(self.scope["user"].id)
        sender_id = str(event.get("sender_id"))

        if sender_id and sender_id != current_user_id:
            await self.mark_message_read(event.get("message_id"))

        await self.send(
            text_data=json.dumps(
                {
                    "message_id": event.get("message_id"),
                    "message": event["message"],
                    "sender_id": event["sender_id"],
                    "sender_name": event.get("sender_name"),
                    "created_at": event["created_at"],
                }
            )
        )

    @database_sync_to_async
    def get_room(self):

        return ChatRoom.objects.select_related(
            "user1",
            "user2",
        ).get(id=self.room_id)

    @database_sync_to_async
    def save_message(self, sender, content):

        room = ChatRoom.objects.get(id=self.room_id)

        return Message.objects.create(room=room, sender=sender, content=content)

    @database_sync_to_async
    def mark_message_read(self, message_id):

        if not message_id:
            return

        Message.objects.filter(
            id=message_id,
            room_id=self.room_id
        ).exclude(
            sender=self.scope["user"]
        ).update(
            is_read=True
        )

    def get_sender_name(self, user):

        try:

            return user.profile.full_name or user.email

        except Exception:

            return user.email
