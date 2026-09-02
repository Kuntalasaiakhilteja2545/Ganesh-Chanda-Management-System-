from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'model_name', 'record_id']
    list_filter = ['action', 'model_name']
    readonly_fields = ['user', 'action', 'model_name', 'record_id', 'old_values', 'new_values', 'ip_address', 'user_agent', 'timestamp']
