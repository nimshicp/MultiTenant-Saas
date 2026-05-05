from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

from customers.models import Client

from .authentication import PlatformAdminJWTAuthentication
from .models import PlatformAdmin
from .permissions import IsPlatformAdmin
from .serializers import PlatformAdminSerializer, PlatformLoginSerializer


def create_platform_tokens(admin):
    refresh = RefreshToken()
    refresh["platform_admin_id"] = str(admin.id)
    refresh["user_type"] = "platform_admin"
    refresh["email"] = admin.email
    refresh["name"] = admin.name
    return refresh


class PlatformHomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "message": "Platform admin API is available.",
                "endpoints": {
                    "login": "/api/platform/login/",
                    "refresh": "/api/platform/refresh/",
                    "logout": "/api/platform/logout/",
                    "me": "/api/platform/me/",
                    "dashboard": "/api/platform/dashboard/",
                    "tenants": "/api/platform/tenants/",
                },
            }
        )


class PlatformLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PlatformLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]

        try:
            admin = PlatformAdmin.objects.get(email=email, is_active=True)
        except PlatformAdmin.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not admin.check_password(password):
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = create_platform_tokens(admin)
        response = Response(
            {
                "access": str(refresh.access_token),
                "platform_admin": PlatformAdminSerializer(admin).data,
            }
        )

        response.set_cookie(
            key="platform_refresh_token",
            value=str(refresh),
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="Lax",
            max_age=settings.REFRESH_TOKEN_LIFETIME,
            path="/api/platform/refresh/",
        )
        return response


class PlatformRefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("platform_refresh_token") or request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            if refresh.get("user_type") != "platform_admin":
                return Response({"error": "Invalid token type"}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({"access": str(refresh.access_token)})
        except Exception:
            return Response({"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)


class PlatformLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"success": True, "message": "Logged out successfully"})
        response.delete_cookie("platform_refresh_token", path="/api/platform/refresh/")
        return response


class CurrentPlatformAdminView(APIView):
    authentication_classes = [PlatformAdminJWTAuthentication]
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        return Response(PlatformAdminSerializer(request.user).data)


class PlatformDashboardView(APIView):
    authentication_classes = [PlatformAdminJWTAuthentication]
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        tenants = Client.objects.order_by("-created_at")
        return Response(
            {
                "platform_admin": PlatformAdminSerializer(request.user).data,
                "tenant_stats": {
                    "total": tenants.count(),
                    "active": tenants.filter(is_active=True).count(),
                    "inactive": tenants.filter(is_active=False).count(),
                    "by_plan": {
                        "starter": tenants.filter(subscription_plan="starter").count(),
                        "pro": tenants.filter(subscription_plan="pro").count(),
                        "enterprise": tenants.filter(subscription_plan="enterprise").count(),
                    },
                },
                "recent_tenants": [
                    {
                        "id": tenant.id,
                        "name": tenant.name,
                        "schema_name": tenant.schema_name,
                        "license_number": tenant.license_number,
                        "state": tenant.state,
                        "company_type": tenant.company_type,
                        "subscription_plan": tenant.subscription_plan,
                        "is_active": tenant.is_active,
                        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
                    }
                    for tenant in tenants[:10]
                ],
            }
        )



