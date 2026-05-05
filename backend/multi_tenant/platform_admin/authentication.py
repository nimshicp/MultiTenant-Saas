from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from .models import PlatformAdmin


class PlatformAdminJWTAuthentication(JWTAuthentication):
    """
    JWT authentication for platform admins only.
    Uses the `platform_admin_id` claim instead of the tenant user model.
    """

    def get_user(self, validated_token):
        try:
            admin_id = validated_token["platform_admin_id"]
        except KeyError as exc:
            raise InvalidToken("Token contained no platform_admin_id") from exc

        try:
            admin = PlatformAdmin.objects.get(pk=admin_id, is_active=True)
        except PlatformAdmin.DoesNotExist as exc:
            raise AuthenticationFailed("Platform admin not found", code="platform_admin_not_found") from exc

        if validated_token.get("user_type") != "platform_admin":
            raise AuthenticationFailed("Invalid token type", code="invalid_token_type")

        return admin
