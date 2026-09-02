from django.contrib import admin
from .models import ExpenseCategory, Expense


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_telugu', 'is_active', 'display_order']
    list_filter = ['is_active']
    ordering = ['display_order']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'category', 'festival', 'paid_by', 'expense_date']
    list_filter = ['festival', 'category', 'payment_method', 'is_deleted']
    search_fields = ['description']
    date_hierarchy = 'expense_date'
