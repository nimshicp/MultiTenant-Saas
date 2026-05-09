from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import  UserProfile
from .serializers import UserSerializer, CreateUserSerializer
from .permissions import IsCompanyAdmin
from authentication.models import TenantUserMap

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class CreateProjectManagerView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Force the role to PROJECT_MANAGER
        user = serializer.save(role="PROJECT_MANAGER", is_active=True)
        UserProfile.objects.create(user=user, designation="Project Manager")

        # Create the mapping in public schema
        TenantUserMap.objects.create(
            email=user.email,
            schema_name=request.tenant.schema_name,
            role="PROJECT_MANAGER"
        )

        self.send_welcome_email(request, user, request.data.get("password"))
        return Response(UserSerializer(user).data, status=201)

    def send_welcome_email(self, request, user, password):
        subject = f"Welcome to {request.tenant.name}"
        message = f"Hello {user.username},\nLogin with: {user.email} / {password}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])