from django.urls import path, include

urlpatterns = [
    # Wrap all tenant APIs in /api/ prefix to match frontend
    path("api/auth/", include("accounts.urls")),
    path("api/user/", include("accounts.urls")),
    path("api/employee/", include("employee.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/meetings/", include("meeting.urls")),
    # Also keep non-prefixed for compatibility if needed

    
    path("auth/", include("accounts.urls")),
    path("employee/", include("employee.urls")),
    path("projects/", include("projects.urls")),
]
