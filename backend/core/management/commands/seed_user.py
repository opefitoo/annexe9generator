"""
Management command to seed the initial admin user.
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Seed the initial admin user"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-password',
            action='store_true',
            help='Reset password for existing user',
        )

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        password = os.environ.get('ADMIN_PASSWORD')

        if not password:
            self.stdout.write(
                self.style.ERROR("ADMIN_PASSWORD environment variable is required")
            )
            return

        user = User.objects.filter(username=username).first()

        if user:
            if options['reset_password'] or os.environ.get('RESET_ADMIN_PASSWORD', '').lower() == 'true':
                user.set_password(password)
                user.email = email
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f"Password reset for admin user: {username}")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"Admin user '{username}' already exists. Use --reset-password to update password.")
                )
        else:
            User.objects.create_superuser(username, email, password)
            self.stdout.write(
                self.style.SUCCESS(f"Created admin user: {username}")
            )
