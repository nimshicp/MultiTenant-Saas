from django.contrib.auth.models import AbstractUser
from django.db import models

class TenantUser(AbstractUser):

    ROLE_CHOICES = (
        ("COMPANY_ADMIN", "Company Admin"),
        ("PROJECT_MANAGER", "Project Manager"),
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES
    )

    email = models.EmailField()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class TenantProfile(models.Model):


    user = models.OneToOneField(
        TenantUser,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    phone = models.CharField(max_length=15)

    designation = models.CharField(max_length=100)

    


    def __str__(self):
        return self.user.email

