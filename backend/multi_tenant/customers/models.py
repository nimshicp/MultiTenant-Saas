from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Client(TenantMixin):
    
    name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=50)
    company_type = models.CharField(max_length=50, choices=[
        ('general_contractor', 'General Contractor'),
        ('developer', 'Developer'),
        ('home_builder', 'Home Builder'),
    ], default='general_contractor')
    subscription_plan = models.CharField(max_length=50, choices=[
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ], default='starter')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Required by django-tenants
    auto_create_schema = True
    auto_drop_schema = False
    
    def __str__(self):
        return self.name

class Domain(DomainMixin):
   
    pass