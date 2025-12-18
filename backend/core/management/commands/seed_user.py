"""
Management command to seed the initial admin user.
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Seed the initial admin user"

    def handle(self, *args, **options):
        # Use environment variables if set, otherwise use defaults (for dev only)
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        password = os.environ.get('ADMIN_PASSWORD', 'admin123')

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            self.stdout.write(
                self.style.SUCCESS(f"Created admin user: {username}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Admin user '{username}' already exists")
            )
