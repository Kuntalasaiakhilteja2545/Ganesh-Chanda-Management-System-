"""
PlannedExpense / Budget Model
"""

from django.db import models
from common.models import TimestampMixin
from common.validators import positive_amount_validator


class PlannedExpense(TimestampMixin, models.Model):
    festival = models.ForeignKey(
        'festivals.Festival',
        on_delete=models.CASCADE,
        related_name='planned_expenses',
    )
    category = models.ForeignKey(
        'expenses.ExpenseCategory',
        on_delete=models.PROTECT,
        related_name='planned_expenses',
    )
    description = models.CharField(max_length=300, blank=True)
    planned_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[positive_amount_validator],
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'planned_expenses'
        ordering = ['category__display_order']
        unique_together = ['festival', 'category']  # One plan per category per festival

    def __str__(self):
        return f"{self.category.name}: ₹{self.planned_amount} ({self.festival.year})"
