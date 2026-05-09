from django.conf import settings
from django.db import connection

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import (
AllowAny,
IsAuthenticated
)

from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.serializers import UserSerializer

from .serializers import LoginSerializer

from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from accounts.serializers import UserSerializer
from .serializers import LoginSerializer

from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from accounts.serializers import UserSerializer
from .serializers import LoginSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # TenantMainMiddleware has already switched the schema 
        # based on the hostname (e.g., myntra.localhost)
        user = User.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            return Response({"error": "Invalid credentials"}, status=401)

        # Generate JWT Tokens
        refresh = RefreshToken.for_user(user)

        # Prepare base response
        user_type = "SUPER_ADMIN" if connection.schema_name == "public" else "TENANT_USER"
        
        response = Response({
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
            "user_type": user_type,
            "schema_name": connection.schema_name
        })

        # Set Refresh Token in HttpOnly Cookie
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=not settings.DEBUG,  # True in production (HTTPS), False in dev
            samesite="Lax",
            max_age=settings.REFRESH_TOKEN_LIFETIME # Uses the 7 days from your settings
        )

        return response
    
class LogoutView(APIView):


    permission_classes = [IsAuthenticated]

    def post(self, request):

        response = Response({

            "success": True,

            "message":
                "Logged out successfully"
        })

        response.delete_cookie(
            "refresh_token"
        )

        return response


class RefreshTokenView(APIView):


    permission_classes = [AllowAny]

    def post(self, request):

        refresh_token = request.COOKIES.get(
            "refresh_token"
        )

        if not refresh_token:

            return Response({

                "error":
                    "Refresh token not found"

            }, status=401)

        try:

            refresh = RefreshToken(
                refresh_token
            )

            access_token = str(
                refresh.access_token
            )

            return Response({

                "access":
                    access_token
            })

        except Exception:

            return Response({

                "error":
                    "Invalid or expired refresh token"

            }, status=401)

