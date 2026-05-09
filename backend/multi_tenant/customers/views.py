from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_tenants.utils import schema_context

from authentication.models import TenantUserMap
from .serializers import SignupSerializer
from .models import Client, Domain

class CompanySignupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Generate unique schema name and subdomain
        schema_name = f"tenant_{data['company_name'].lower().replace(' ', '_')}"
        subdomain = data['company_name'].lower().replace(' ', '')

        # 2. Prevent duplicate license numbers
        if Client.objects.filter(license_number=data['license_number']).exists():
            return Response({'error': 'A company with this license number already exists'}, status=400)

        # 3. Create Tenant (This triggers schema creation in the DB)
        client = Client.objects.create(
            schema_name=schema_name,
            name=data['company_name'],
            license_number=data['license_number'],
            state=data['state'],
            company_type=data['company_type'],
            subscription_plan=data['subscription_plan'],
            is_active=True
        )

        # 4. Create Domain (Required by django-tenants)
        Domain.objects.create(
            tenant=client,
            domain=f"{subdomain}.localhost",
            is_primary=True
        )

        # 5. Create Company Admin inside the NEW schema
        with schema_context(schema_name):
            # Pointing to the unified model and profile from your accounts app
            from accounts.models import User, UserProfile 

            user = User.objects.create_user(
                email=data['manager_email'],
                username=data['manager_email'], # Or generate a unique username
                password=data['password'],
                role='COMPANY_ADMIN',
                name=data.get('manager_name', ''), # If you added name to your model
                is_active=True
            )

            # Create Unified Profile
            UserProfile.objects.create(
                user=user,
                designation='Company Admin'
            )

        # 6. Create Tenant Mapping in PUBLIC schema 
        # (This allows the login view to find which schema the user belongs to)
        TenantUserMap.objects.create(
            email=data['manager_email'],
            schema_name=schema_name,
            role='COMPANY_ADMIN'
        )

        return Response({
            'success': True,
            'message': f'Company {data["company_name"]} registered successfully.',
        
            'schema_name': schema_name, # Frontend needs this to login
            'subdomain': subdomain
        }, status=201)