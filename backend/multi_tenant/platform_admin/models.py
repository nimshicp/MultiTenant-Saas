from django.contrib.auth.models import AbstractUser
from django.db import models

class PlatformUser(AbstractUser):


    ROLE_CHOICES = (
        ("SUPER_ADMIN", "Super Admin"),
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default="SUPER_ADMIN"
    )

    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class PlatformProfile(models.Model):


    user = models.OneToOneField(
        PlatformUser,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    phone = models.CharField(max_length=15)

    

    def __str__(self):
        return self.user.email
