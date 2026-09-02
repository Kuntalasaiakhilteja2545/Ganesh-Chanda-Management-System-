from django.contrib import admin
from .models import Donor


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ['name', 'mobile_number', 'is_deleted', 'created_at']
    list_filter = ['is_deleted']
    search_fields = ['name', 'mobile_number']
