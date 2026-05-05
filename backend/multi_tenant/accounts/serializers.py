from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """Login serializer - works for any user in current tenant schema"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class CreateProjectManagerSerializer(serializers.Serializer):
    """Create project manager WITHIN a tenant (company admin action)"""
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_email(self, value):
        """Check email uniqueness within current tenant"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User already exists in this tenant")
        
        return value.lower()
    
    def create(self, validated_data):
        request = self.context['request']
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role='project_manager',
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """User response serializer"""
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'is_active', 'created_at']


