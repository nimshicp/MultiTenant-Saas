from rest_framework import serializers

from .models import Meeting

from accounts.models import User


class ParticipantSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = [
            "id",
            "email",
        ]


class MeetingSerializer(
    serializers.ModelSerializer
):

    organizer =ParticipantSerializer(
            read_only=True
        )

    participants =ParticipantSerializer(

            many=True,

            read_only=True
        )

    is_organizer =serializers.SerializerMethodField()


    class Meta:

        model = Meeting

        fields = [

            "id",

            "title",

            "description",

            "organizer",

            "participants",

            "start_time",

            "end_time",

            "meeting_link",

            "status",

            "created_at",

            "is_organizer",
        ]


    def get_is_organizer(
        self,
        obj
    ):

        request =self.context.get(
                "request"
            )

        if request:

            return (
                obj.organizer
                ==
                request.user
            )

        return False

class CreateMeetingSerializer(serializers.ModelSerializer):

    participants = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )

    class Meta:

        model = Meeting

        fields = [
            "title",
            "description",
            "participants",
            "start_time",
            "end_time",
            "meeting_link",
        ]

    def create(self, validated_data):

        participant_ids = validated_data.pop(
            "participants",
            []
        )

        request = self.context["request"]

        organizer = request.user

        meeting = Meeting.objects.create(
            organizer=organizer,
            **validated_data
        )

        users = User.objects.filter(
            id__in=participant_ids
        )

        meeting.participants.set(users)

        # organizer also becomes participant
        meeting.participants.add(organizer)

        return meeting
    
    def validate(self, data):

        if data["end_time"] <= data["start_time"]:

            raise serializers.ValidationError(
            "End time must be after start time."
        )

        return data