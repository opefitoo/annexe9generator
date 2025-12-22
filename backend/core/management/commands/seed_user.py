"""
Management command to seed the initial admin and readonly users.
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Seed the initial admin and readonly users"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-password',
            action='store_true',
            help='Reset password for existing user',
        )

    def _create_or_update_user(self, username, email, password, is_staff, is_superuser, reset_password):
        """Create or update a user."""
        user = User.objects.filter(username=username).first()

        if user:
            if reset_password:
                user.set_password(password)
                user.email = email
                user.is_staff = is_staff
                user.is_superuser = is_superuser
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f"Password reset for user: {username}")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"User '{username}' already exists. Use --reset-password to update.")
                )
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_staff=is_staff,
                is_superuser=is_superuser,
            )
            role = "admin" if is_staff else "readonly"
            self.stdout.write(
                self.style.SUCCESS(f"Created {role} user: {username}")
            )

    def handle(self, *args, **options):
        reset_password = options['reset_password'] or os.environ.get('RESET_ADMIN_PASSWORD', '').lower() == 'true'

        # Create admin user
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        admin_password = os.environ.get('ADMIN_PASSWORD')

        if not admin_password:
            self.stdout.write(
                self.style.ERROR("ADMIN_PASSWORD environment variable is required")
            )
            return

        self._create_or_update_user(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            is_staff=True,
            is_superuser=True,
            reset_password=reset_password,
        )

        # Create readonly user (optional)
        readonly_username = os.environ.get('READONLY_USERNAME')
        readonly_password = os.environ.get('READONLY_PASSWORD')
        readonly_email = os.environ.get('READONLY_EMAIL', 'readonly@example.com')

        if readonly_username and readonly_password:
            self._create_or_update_user(
                username=readonly_username,
                email=readonly_email,
                password=readonly_password,
                is_staff=False,
                is_superuser=False,
                reset_password=reset_password,
            )
