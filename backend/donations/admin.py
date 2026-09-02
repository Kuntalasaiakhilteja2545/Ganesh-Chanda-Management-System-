from django.contrib import admin
from .models import Donation, Receipt


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['id', 'donor', 'amount', 'payment_method', 'festival', 'collected_by', 'donation_date', 'status']
    list_filter = ['festival', 'payment_method', 'status', 'is_deleted']
    search_fields = ['donor__name', 'transaction_id']
    date_hierarchy = 'donation_date'


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'donation', 'festival', 'created_at']
    list_filter = ['festival']
    search_fields = ['receipt_number']
