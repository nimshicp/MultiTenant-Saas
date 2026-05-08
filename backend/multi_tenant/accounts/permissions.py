from rest_framework.permissions import BasePermission


class IsAuthenticatedUser(BasePermission):
    """
    Ensures user is logged in
    (You can also use DRF's built-in IsAuthenticated)
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsCompanyAdmin(BasePermission):
    """
    Only Company Admin can:
    - Create project managers
    - Create projects
    - Assign projects
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "company admin"


class IsProjectManager(BasePermission):
    """
    Only Project Manager can:
    - View assigned projects
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "project manager"


class IsAdminOrPM(BasePermission):
    """
    Both Company Admin & Project Manager can access
    (for shared endpoints like viewing projects list)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "company admin",
            "project manager"
        ]