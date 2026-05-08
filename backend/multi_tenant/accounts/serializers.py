from rest_framework import serializers

from .models import TenantUser
from .models import TenantProfile

class UserProfileSerializer(serializers.ModelSerializer):


    class Meta:
        model = TenantProfile
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = TenantUser
        fields = [
            "id",
            "email",
            "username",
            "role",
            "profile"
        ]
    

class CreateProjectManagerSerializer(serializers.ModelSerializer):


    password = serializers.CharField(write_only=True)

    class Meta:
        model = TenantUser
        fields = [
            "email",
            "username",
            "password"
        ]

    def create(self, validated_data):

        user = TenantUser.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            role="PROJECT_MANAGER"
        )

        TenantProfile.objects.create(
            user=user,
            designation="Project Manager"
        )

        return user

