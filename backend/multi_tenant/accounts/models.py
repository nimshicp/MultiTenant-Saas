from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Combined roles for both Platform and Tenants
    ROLE_CHOICES = (
        ("SUPER_ADMIN", "Super Admin"),
        ("COMPANY_ADMIN", "Company Admin"),
        ("PROJECT_MANAGER", "Project Manager"),
    )

    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "name"]

    def __str__(self):
        return f"{self.email} ({self.role})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=15, blank=True, default="")
    designation = models.CharField(max_length=100, blank=True, default="")

    def __str__(self):
        return self.user.email