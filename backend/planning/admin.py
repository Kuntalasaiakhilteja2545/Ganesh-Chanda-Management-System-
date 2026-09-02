from django.contrib import admin
from .models import PlannedExpense


@admin.register(PlannedExpense)
class PlannedExpenseAdmin(admin.ModelAdmin):
    list_display = ['category', 'planned_amount', 'festival', 'description']
    list_filter = ['festival']
