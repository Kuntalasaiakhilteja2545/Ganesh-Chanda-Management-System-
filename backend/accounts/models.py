"""
Custom User Model (Stub for Phase 1)

WHAT: Replaces Django's default User model with our own that adds 'role'.
WHY:  Django's built-in User has username/email/password but no 'role' field.
      We need ADMIN/TREASURER/COLLECTOR roles for permission control.

CRITICAL RULE:
    AUTH_USER_MODEL must be set BEFORE the first migration.
    If you run migrations with Django's default User, then try to switch later,
    it causes extremely painful database issues. This is why we create this
    stub NOW in Phase 1, even though we'll add more fields in Phase 2.

HOW:
    We extend AbstractUser which gives us all of Django's auth functionality
    (password hashing, login, sessions) PLUS our custom fields.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models

from common.constants import Roles


class User(AbstractUser):
    """
    Custom User model for the Ganesh Chanda Management System.
    
    Inherits from AbstractUser which provides:
    - username, email, password (hashed), first_name, last_name
    - is_active, is_staff, is_superuser
    - date_joined, last_login
    
    We ADD:
    - role: ADMIN, TREASURER, or COLLECTOR
    - full_name: Single field instead of first_name + last_name
    - mobile_number: For contact
    """
    role = models.CharField(
        max_length=20,
        choices=Roles.CHOICES,
        default=Roles.COLLECTOR,
        db_index=True,
        help_text='User role determines permissions: ADMIN > TREASURER > COLLECTOR'
    )
    full_name = models.CharField(
        max_length=150,
        blank=True,
        help_text='Full name of the committee member'
    )
    mobile_number = models.CharField(
        max_length=15,
        blank=True,
        help_text='Mobile number for contact'
    )

    class Meta:
        db_table = 'users'  # Explicit table name instead of Django's default 'accounts_user'
        ordering = ['username']

    def __str__(self):
        return f"{self.full_name or self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == Roles.ADMIN

    @property
    def is_treasurer(self):
        return self.role == Roles.TREASURER

    @property
    def is_collector(self):
        return self.role == Roles.COLLECTOR
