from django.urls import path
from .views import (
    CreateProjectManagerView,
    CurrentUserView,
    
)

urlpatterns = [
    
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('create/', CreateProjectManagerView.as_view(), name='create-pm'),
]