from django.conf import settings
from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from authentication.models import TenantUserMap

from .permissions import IsCompanyAdmin

from .serializers import (
UserSerializer,
CreateProjectManagerSerializer
)

from .models import TenantUser
from .models import TenantProfile

class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response(
            UserSerializer(request.user).data
        )


class CreateProjectManagerView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsCompanyAdmin
    ]

    def post(self, request):

        serializer = CreateProjectManagerSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data["password"]

        # Create Project Manager User
        user = TenantUser.objects.create_user(

            email=serializer.validated_data["email"],

            username=serializer.validated_data["username"],

            password=password,

            role="PROJECT_MANAGER",
            is_active=True
        )

        # Create User Profile
        TenantProfile.objects.create(

            user=user,

            designation="Project Manager"
        )

        # Create Tenant Mapping
        TenantUserMap.objects.create(

            email=user.email,

            schema_name=request.tenant.schema_name,

            role="PROJECT_MANAGER"
        )

        # Send Welcome Email
        email_sent = self.send_welcome_email(
            request,
            user,
            password
        )

        return Response({

            "success": True,

            "message": "Project Manager created successfully",

            "email_sent": email_sent,

            "user": UserSerializer(user).data

        }, status=201)

    def send_welcome_email(self, request, user, password):

        try:

            tenant_name = request.tenant.name

            subject = f"Welcome to {tenant_name}"

            message = f'''
    

    Hello {user.username},

    Your Project Manager account has been created successfully.

    Login Details:

    Email: {user.email}

    Password: {password}

    Company: {tenant_name}

    Thank you.
    '''

    
            send_mail(

                subject=subject,

                message=message,

                from_email=settings.DEFAULT_FROM_EMAIL,

                recipient_list=[user.email],

                fail_silently=False
            )

            return True

        except Exception as e:

            print("EMAIL ERROR:", str(e))

            return False

