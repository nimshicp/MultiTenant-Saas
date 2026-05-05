from getpass import getpass

from django.core.management.base import BaseCommand

from platform_admin.models import PlatformAdmin


class Command(BaseCommand):
    help = "Create a public-schema platform admin account"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Platform admin email")
        parser.add_argument("--name", type=str, help="Platform admin name")
        parser.add_argument("--password", type=str, help="Platform admin password")

    def handle(self, *args, **options):
        email = options.get("email") or input("Email: ").strip()
        name = options.get("name") or input("Name: ").strip()
        password = options.get("password") or getpass("Password: ")

        if PlatformAdmin.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING("Platform admin already exists."))
            return

        admin = PlatformAdmin.objects.create_superuser(
            email=email,
            name=name,
            password=password,
        )

        self.stdout.write(self.style.SUCCESS(f"Platform admin created: {admin.email}"))
