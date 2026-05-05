from django.urls import path
from .views import CompanySignupView

urlpatterns = [
    path('signup/', CompanySignupView.as_view(), name='signup'),
]