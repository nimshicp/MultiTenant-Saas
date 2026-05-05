from rest_framework import serializers

from .models import PlatformAdmin


class PlatformLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PlatformAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAdmin
        fields = [
            'id',
            'email',
            'name',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
