from django.conf import settings
from django.contrib.auth import authenticate
from django.db import connection

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from platform_admin.models import PlatformUser

from platform_admin.serializers import (
PlatformUserSerializer
)

from accounts.serializers import (
UserSerializer
)

from .models import TenantUserMap

from .serializers import LoginSerializer

class LoginView(APIView):


    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        company = serializer.validated_data["company"]

        email = serializer.validated_data["email"]

        password = serializer.validated_data["password"]

        # SUPER ADMIN LOGIN

        platform_user = PlatformUser.objects.filter(
            email=email
        ).first()

        if platform_user:

            user = authenticate(
                username=email,
                password=password
            )

            if not user:

                return Response({
                    "error": "Invalid credentials"
                }, status=401)

            refresh = RefreshToken.for_user(user)

            response = Response({

                "access":
                    str(refresh.access_token),

                "user":
                    PlatformUserSerializer(user).data,

                "user_type":
                    "SUPER_ADMIN"
            })

            response.set_cookie(

                key="refresh_token",

                value=str(refresh),

                httponly=True,

                secure=settings.COOKIE_SECURE,

                samesite="Lax",

                max_age=settings.REFRESH_TOKEN_LIFETIME
            )

            return response

        # TENANT USER LOGIN

        mapping = TenantUserMap.objects.filter(

            email=email,

            schema_name=company

        ).first()

        if not mapping:

            return Response({

                "error": "Tenant not found"

            }, status=404)

        # SWITCH SCHEMA

        connection.set_schema(
            mapping.schema_name
        )

        # AUTHENTICATE USER

        user = authenticate(

            username=email,

            password=password
        )

        if not user:

            return Response({

                "error": "Invalid credentials"

            }, status=401)

        refresh = RefreshToken.for_user(user)

        response = Response({

            "access":
                str(refresh.access_token),

            "user":
                UserSerializer(user).data,

            "user_type":
                "TENANT_USER",

            "schema_name":
                mapping.schema_name
        })

        response.set_cookie(

            key="refresh_token",

            value=str(refresh),

            httponly=True,

            secure=settings.COOKIE_SECURE,

            samesite="Lax",

            max_age=settings.REFRESH_TOKEN_LIFETIME
        )

        return response


class LogoutView(APIView):


    permission_classes = [IsAuthenticated]

    def post(self, request):

        response = Response({

            "success": True,

            "message": "Logged out successfully"
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
                    "Invalid refresh token"

            }, status=401)

