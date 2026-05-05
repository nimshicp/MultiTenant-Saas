from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and getattr(request.user, "is_platform_admin", False)
            and getattr(request.user, "is_active", False)
        )


