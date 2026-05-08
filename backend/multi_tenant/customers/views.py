from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from django_tenants.utils import schema_context

from authentication.models import (
TenantUserMap
)

from .serializers import SignupSerializer
from .models import Client, Domain

class CompanySignupView(APIView):


    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):

        serializer = SignupSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = serializer.validated_data

        # Generate schema + subdomain

        schema_name = (
            f"tenant_"
            f"{data['company_name'].lower().replace(' ', '_')}"
        )

        subdomain = (
            data['company_name']
            .lower()
            .replace(' ', '')
        )

        # Check duplicate company

        if Client.objects.filter(
            license_number=data['license_number']
        ).exists():

            return Response({

                'error':
                    'Company already exists'

            }, status=400)

        # Create Tenant + Schema

        client = Client.objects.create(

            schema_name=schema_name,

            name=data['company_name'],

            license_number=data['license_number'],

            state=data['state'],

            company_type=data['company_type'],

            subscription_plan=data['subscription_plan'],

            is_active=True
        )

        # Create Domain

        Domain.objects.create(

            tenant=client,

            domain=f"{subdomain}.localhost",

            is_primary=True
        )

        # Create Company Admin
        # inside tenant schema

        with schema_context(schema_name):

            from accounts.models import (
                TenantUser,
                TenantProfile
            )

            user = TenantUser.objects.create_user(

                email=data['manager_email'],

                username=data['manager_email'],

                password=data['password'],

                role='COMPANY_ADMIN',

                is_active=True
            )

            # Create Profile

            TenantProfile.objects.create(

                user=user,

                designation='Company Admin'
            )

        # Create Tenant Mapping

        TenantUserMap.objects.create(

            email=data['manager_email'],

            schema_name=schema_name,

            role='COMPANY_ADMIN'
        )

        return Response({

            'success': True,

            'message':
                f'{data['company_name']} '
                f'registered successfully',

            'subdomain':
                subdomain,

            'admin_email':
                data['manager_email']

        }, status=201)

