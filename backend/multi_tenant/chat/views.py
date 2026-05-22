from rest_framework.views import APIView

from rest_framework.response import Response

from rest_framework.permissions import (
    IsAuthenticated
)

from rest_framework import status

from django.db.models import Q

from employee.models import Employee

from .models import (
    ChatRoom,
    Message
)

from .serializers import (
    MessageSerializer
)


def get_room_between_users(
    user1,
    user2
):

    return ChatRoom.objects.filter(
        Q(user1=user1, user2=user2)
        | Q(user1=user2, user2=user1)
    ).order_by(
        "-created_at"
    ).first()


def get_rooms_between_users(
    user1,
    user2
):

    return ChatRoom.objects.filter(
        Q(user1=user1, user2=user2)
        | Q(user1=user2, user2=user1)
    )


class ChatUsersView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        users = Employee.objects.select_related(
            "user",
            "user__profile"
        ).filter(
            tenant=request.tenant
        ).exclude(
            user=request.user
        )

        data = []

        for employee in users:

            rooms = get_rooms_between_users(
                request.user,
                employee.user
            )

            unread_count = 0

            if rooms.exists():

                unread_count = Message.objects.filter(
                    room__in=rooms,
                    is_read=False
                ).exclude(
                    sender=request.user
                ).distinct().count()

            room = get_room_between_users(
                request.user,
                employee.user
            )

            data.append({

                "id":
                    employee.user.id,

                "full_name":
                    employee.user.profile.full_name if hasattr(employee.user, "profile") else employee.user.email,

                "role":
                    employee.role,

                "room_id":
                    str(room.id) if room else None,

                "unread_count":
                    unread_count,
            })

        return Response(data)


class CreateOrGetChatRoomView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        other_user_id = request.data.get(
            "user_id"
        )

        if not other_user_id:

            return Response(
                {
                    "detail":
                        "user_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            other_employee = Employee.objects.get(
                user_id=other_user_id,
                tenant=request.tenant
            )

        except Employee.DoesNotExist:

            return Response(
                {
                    "detail":
                        "User not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        current_user = request.user

        if str(current_user.id) == str(other_user_id):

            return Response(
                {
                    "detail":
                        "Cannot chat with yourself."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        room = get_room_between_users(
            current_user,
            other_employee.user
        )

        if not room:

            room = ChatRoom.objects.create(

                user1=current_user,

                user2=other_employee.user
            )

        return Response({

            "room_id": str(room.id)
        })


class ChatMessagesView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        room_id
    ):

        try:

            room = ChatRoom.objects.get(
                id=room_id
            )

        except ChatRoom.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Room not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # SECURITY CHECK
        if (
            room.user1_id != request.user.id
            and room.user2_id != request.user.id
        ):

            return Response(
                {
                    "detail":
                        "Forbidden"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        room.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(
            is_read=True
        )

        messages = room.messages.all()

        serializer = MessageSerializer(
            messages,
            many=True
        )

        return Response(serializer.data)
