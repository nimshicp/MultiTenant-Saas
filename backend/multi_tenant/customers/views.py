from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_tenants.utils import schema_context
from .serializers import SignupSerializer
from .models import Client, Domain


class CompanySignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Generate schema + subdomain
        schema_name = f"tenant_{data['company_name'].lower().replace(' ', '_')}"
        subdomain = data['company_name'].lower().replace(' ', '')

        # Check duplicate company
        if Client.objects.filter(license_number=data['license_number']).exists():
            return Response({'error': 'Company already exists'}, status=400)

        # Create tenant (company)
        client = Client.objects.create(
            schema_name=schema_name,
            name=data['company_name'],
            license_number=data['license_number'],
            state=data['state'],
            company_type=data['company_type'],
            subscription_plan=data['subscription_plan'],
            is_active=True
        )

        # Create domain
        Domain.objects.create(
            tenant=client,
            domain=f"{subdomain}.localhost",
            is_primary=True
        )

        # Create admin user inside tenant
        with schema_context(schema_name):
            from accounts.models import User

            User.objects.create_user(
                email=data['manager_email'],
                name=data['manager_name'],
                password=data['password'],  
                role='company_admin',
                is_active=True
            )

        return Response({
            'success': True,
            'message': f'{data["company_name"]} registered successfully',
            'subdomain': subdomain,
            'login_url': f"http://{subdomain}.localhost:8000/api/auth/login",
            'admin_email': data['manager_email']
        }, status=201)
