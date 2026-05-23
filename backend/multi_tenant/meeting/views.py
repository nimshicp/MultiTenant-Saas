from django.db.models import Q

from rest_framework import status

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework.views import APIView

from .models import Meeting

from .serializers import (
    MeetingSerializer,
    CreateMeetingSerializer,
)


class CreateMeetingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CreateMeetingSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():

            meeting = serializer.save()

            response_serializer = MeetingSerializer(
                meeting, context={"request": request}
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeetingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        meetings = (
            Meeting.objects.filter(
                Q(organizer=request.user) | Q(participants=request.user)
            )
            .exclude(status__iexact="cancelled")
            .distinct()
            .order_by("start_time")
        )
        serializer = MeetingSerializer(
            meetings, many=True, context={"request": request}
        )
        return Response(serializer.data)


class UpcomingMeetingView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        from django.utils.timezone import now

        meetings = (
            Meeting.objects.filter(
                Q(organizer=request.user) | Q(participants=request.user),
                start_time__gte=now(),
                status="scheduled",
            )
            .distinct()
            .order_by("start_time")
        )

        serializer = MeetingSerializer(
            meetings, many=True, context={"request": request}
        )

        return Response(serializer.data)


class MeetingDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, meeting_id, user):

        try:

            return Meeting.objects.get(id=meeting_id, participants=user)

        except Meeting.DoesNotExist:

            return None

    def get(self, request, meeting_id):

        meeting = self.get_object(meeting_id, request.user)

        if not meeting:

            return Response(
                {"detail": "Meeting not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = MeetingSerializer(meeting, context={"request": request})

        return Response(serializer.data)

    def put(self, request, meeting_id):

        meeting = self.get_object(meeting_id, request.user)

        if not meeting:

            return Response(
                {"detail": "Meeting not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # only organizer can edit
        if meeting.organizer != request.user:

            return Response(
                {"detail": "Only organizer can edit meeting."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CreateMeetingSerializer(
            meeting, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():

            serializer.save()

            return Response(MeetingSerializer(meeting).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, meeting_id):

        meeting = self.get_object(meeting_id, request.user)

        if not meeting:

            return Response(
                {"detail": "Meeting not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # only organizer can cancel
        if meeting.organizer != request.user:

            return Response(
                {"detail": "Only organizer can cancel meeting."},
                status=status.HTTP_403_FORBIDDEN,
            )

        meeting.status = "cancelled"

        meeting.save()

        return Response({"detail": "Meeting cancelled successfully."})
