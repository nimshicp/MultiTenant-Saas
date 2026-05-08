from rest_framework import serializers

from .models import PlatformUser
from .models import PlatformProfile

class PlatformProfileSerializer(serializers.ModelSerializer):


    class Meta:
        model = PlatformProfile
        fields = "__all__"


class PlatformUserSerializer(serializers.ModelSerializer):

    profile = PlatformProfileSerializer(read_only=True)

    class Meta:
        model = PlatformUser
        fields = [
            "id",
            "email",
            "username",
            "role",
            "profile"
        ]
