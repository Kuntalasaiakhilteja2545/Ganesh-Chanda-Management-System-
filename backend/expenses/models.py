"""
Expense & ExpenseCategory Models

WHAT:
    ExpenseCategory: Categories like "Decoration", "Sound System", "Food"
    Expense: Individual expense records (₹8,000 for decoration)

WHY TWO MODELS:
    Categories are REUSABLE across years. The same category "Decoration"
    exists in 2025 and 2026, but the expenses are different.
    
    Separating categories from expenses allows:
    - Category-wise reporting (total spent on decoration across years)
    - Admin can add new categories without touching expense records
    - Default categories can be pre-loaded
"""

from django.conf import settings
from django.db import models
from common.models import TimestampMixin, SoftDeleteMixin
from common.constants import PaymentMethods
from common.validators import positive_amount_validator


class ExpenseCategory(TimestampMixin, models.Model):
    """
    Expense categories — reusable across festivals.
    
    Default categories (pre-loaded):
        Ganesh Idol, Decoration, Flowers, Lighting, Electrical,
        Sound System, Pooja Materials, Food, Water, Transportation,
        Printing, Cleaning, Prasadam, Cultural Program, Miscellaneous
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Category name in English'
    )
    name_telugu = models.CharField(
        max_length=100,
        blank=True,
        help_text='Category name in Telugu'
    )
    description = models.TextField(
        blank=True,
        help_text='Optional description of this category'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Inactive categories are hidden from dropdowns'
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text='Order in which categories appear in dropdowns'
    )

    class Meta:
        db_table = 'expense_categories'
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Expense categories'

    def __str__(self):
        return self.name


class Expense(TimestampMixin, SoftDeleteMixin, models.Model):
    """
    Individual expense record — every money spent.
    """
    festival = models.ForeignKey(
        'festivals.Festival',
        on_delete=models.PROTECT,
        related_name='expenses',
        help_text='Which festival year this expense belongs to'
    )
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT,
        related_name='expenses',
        help_text='Expense category (Decoration, Food, etc.)'
    )
    description = models.CharField(
        max_length=300,
        help_text='What was this expense for (e.g., "Main stage decoration")'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[positive_amount_validator],
        help_text='Expense amount / Advance paid in INR (must be positive)'
    )
    total_estimated_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Total agreed cost/price with vendor (e.g. ₹25,000 for Ganesh Idol)'
    )
    payment_status = models.CharField(
        max_length=30,
        default='FULLY_PAID',
        choices=[
            ('FULLY_PAID', 'Fully Paid / పూర్తిగా చెల్లించబడింది'),
            ('ADVANCE_PAID', 'Advance Paid / అడ్వాన్స్ చెల్లింపు'),
            ('PARTIAL_PAID', 'Partially Paid / పాక్షిక చెల్లింపు'),
            ('PENDING', 'Payment Pending / బకాయి'),
        ],
        help_text='Payment stage status'
    )
    vendor_name = models.CharField(
        max_length=150,
        blank=True,
        help_text='Vendor / Artist / Shop name (e.g. Dhoolpet Murti Kendra, Sai Sounds)'
    )
    vendor_contact = models.CharField(
        max_length=20,
        blank=True,
        help_text='Vendor phone number'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethods.CHOICES,
        default=PaymentMethods.CASH,
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='Transaction/reference ID for digital payments'
    )
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='paid_expenses',
        help_text='Committee member who paid this expense'
    )
    expense_date = models.DateField(
        help_text='Date the expense was made'
    )
    notes = models.TextField(
        blank=True,
    )

    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['festival', 'expense_date'], name='idx_expense_festival_date'),
            models.Index(fields=['festival', 'category'], name='idx_expense_category'),
        ]

    def __str__(self):
        return f"₹{self.amount} - {self.description} ({self.festival.year})"
