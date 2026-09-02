"""
Account Admin Configuration

WHAT: Registers User model with Django's admin panel.
WHY:  Allows managing users through http://localhost:8000/admin/
      without building a separate UI. Useful for initial setup and debugging.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin panel for our User model.
    
    Extends Django's built-in UserAdmin to show our custom fields
    (role, full_name, mobile_number) in the admin interface.
    """
    list_display = ['username', 'full_name', 'role', 'email', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'full_name', 'email']
    ordering = ['username']

    # Add our custom fields to the admin form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Committee Info', {
            'fields': ('role', 'full_name', 'mobile_number'),
        }),
    )

    # Fields shown when creating a new user in admin
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Committee Info', {
            'fields': ('role', 'full_name', 'mobile_number'),
        }),
    )
