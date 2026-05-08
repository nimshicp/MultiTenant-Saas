from django.contrib import admin
from .models import PlatformProfile,PlatformUser

# Register your models here.
admin.site.register(PlatformUser)
admin.site.register(PlatformProfile)