"""
Donor Model

WHAT: Represents a person who donates to Ganesh Chanda.

WHY SEPARATE FROM DONATION:
    One donor can give multiple donations across multiple years.
    Donor info (name, mobile) is stored ONCE, not repeated in every donation.
    This is database normalization — avoids "Ravi Kumar" in 50 rows.

RELATIONSHIPS:
    Donor → Donation (one-to-many: one donor can make many donations)

SOFT DELETE:
    Donors are never permanently deleted (SoftDeleteMixin).
    If a donor is removed, their historical donations remain intact.

REAL-WORLD EXAMPLE:
    Ravi Kumar donates ₹1,000 in 2025 and ₹2,000 in 2026.
    ONE Donor record, TWO Donation records.
"""

from django.db import models
from common.models import TimestampMixin, SoftDeleteMixin
from common.validators import validate_mobile_number


class Donor(TimestampMixin, SoftDeleteMixin, models.Model):
    """
    Inherits:
        TimestampMixin → created_at, updated_at
        SoftDeleteMixin → is_deleted, deleted_at, soft_delete(), restore()
                          objects (active only), all_objects (including deleted)
    """
    name = models.CharField(
        max_length=150,
        help_text='Full name of the donor'
    )
    mobile_number = models.CharField(
        max_length=15,
        blank=True,  # Optional — some donors may not share their number
        validators=[validate_mobile_number],
        help_text='10-digit mobile number (optional)'
    )
    address = models.TextField(
        blank=True,
        help_text='Donor address (optional)'
    )
    notes = models.TextField(
        blank=True,
        help_text='Internal notes about the donor (not shown publicly)'
    )

    class Meta:
        db_table = 'donors'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='idx_donor_name'),
            models.Index(fields=['mobile_number'], name='idx_donor_mobile'),
        ]

    def __str__(self):
        return self.name
