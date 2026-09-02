"""
Donation & Receipt Models

WHAT: Donation tracks each money contribution. Receipt provides a unique ID for each donation.

WHY TWO MODELS (not one):
    A Donation is the financial transaction.
    A Receipt is the document/proof given to the donor.
    Separating them allows:
    - Receipts to have their own numbering logic
    - A donation to exist before a receipt is generated
    - Receipt format to change without affecting donation data

FINANCIAL SAFETY RULES ENFORCED HERE:
    1. amount uses DecimalField (NEVER float)
    2. amount > 0 enforced by validator
    3. receipt_number is UNIQUE
    4. festival isolation (every donation belongs to one festival)
    5. collected_by tracks who recorded it
    6. Soft delete (financial records never permanently destroyed)

RELATIONSHIPS:
    Festival → Donation  (one-to-many)
    Donor → Donation     (one-to-many)
    User → Donation      (collected_by, one-to-many)
    Donation → Receipt   (one-to-one)
"""

from django.conf import settings
from django.db import models
from common.models import TimestampMixin, SoftDeleteMixin
from common.constants import PaymentMethods, DonationStatus
from common.validators import positive_amount_validator


class Donation(TimestampMixin, SoftDeleteMixin, models.Model):
    """
    Core financial model — every donation transaction.
    """
    festival = models.ForeignKey(
        'festivals.Festival',
        on_delete=models.PROTECT,  # PROTECT: Can't delete a festival that has donations
        related_name='donations',  # festival.donations.all() gives all donations for that festival
        help_text='Which Ganesh Chanda year this donation belongs to'
    )
    donor = models.ForeignKey(
        'donors.Donor',
        on_delete=models.PROTECT,  # PROTECT: Can't delete a donor who has donations
        related_name='donations',
        help_text='Who made this donation'
    )
    amount = models.DecimalField(
        max_digits=12,          # Supports up to ₹99,99,99,99,999.99
        decimal_places=2,
        validators=[positive_amount_validator],  # Must be > 0
        help_text='Donation amount in INR (must be positive)'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethods.CHOICES,
        default=PaymentMethods.CASH,
        help_text='How the donation was paid'
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,  # Optional for cash, recommended for digital
        help_text='Transaction/reference ID for digital payments'
    )
    payment_app = models.CharField(
        max_length=50,
        blank=True,
        help_text='Payment app name (PhonePe, Google Pay, etc.)'
    )
    collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='collected_donations',
        help_text='System user who logged this donation'
    )
    collector_member_name = models.CharField(
        max_length=150,
        blank=True,
        help_text='Youth committee member or volunteer who physically collected this chanda'
    )
    donation_date = models.DateField(
        help_text='Date the donation was received'
    )
    status = models.CharField(
        max_length=20,
        choices=DonationStatus.CHOICES,
        default=DonationStatus.CONFIRMED,
        help_text='Donation status'
    )
    donation_type = models.CharField(
        max_length=50,
        default='CHANDA',
        choices=[
            ('CHANDA', 'General Chanda / సాధారణ చందా'),
            ('VELAM_PAATA', 'Velam Paata (Auction) / వేలం పాట'),
            ('ANNADHANAM', 'Annadanam / అన్నదానం'),
            ('POOJA', 'Special Pooja / పూజ'),
        ],
        help_text='Type of contribution'
    )
    auction_item = models.CharField(
        max_length=150,
        blank=True,
        help_text='Item won in Velam Paata (e.g. Maha Laddu, Small Laddu, Left/Right Tinkayya, Fruits)'
    )
    notes = models.TextField(
        blank=True,
        help_text='Optional notes about this donation'
    )

    class Meta:
        db_table = 'donations'
        ordering = ['-donation_date', '-created_at']
        indexes = [
            models.Index(fields=['festival', 'donation_date'], name='idx_donation_festival_date'),
            models.Index(fields=['festival', 'payment_method'], name='idx_donation_payment'),
            models.Index(fields=['collected_by', 'festival'], name='idx_donation_collector'),
            models.Index(fields=['donor', 'festival'], name='idx_donation_donor'),
            models.Index(fields=['festival', 'donation_type'], name='idx_donation_festival_type'),
        ]

    def __str__(self):
        return f"₹{self.amount} from {self.donor.name} ({self.festival.year})"


class Receipt(TimestampMixin, models.Model):
    """
    Unique receipt for each donation.
    
    FORMAT: GCH-{YEAR}-{SEQUENTIAL_NUMBER}
    Example: GCH-2026-0001, GCH-2026-0002
    
    WHY ONE-TO-ONE:
        Each donation gets exactly ONE receipt.
        donation_id is UNIQUE — prevents duplicate receipts.
    """
    donation = models.OneToOneField(
        Donation,
        on_delete=models.CASCADE,
        related_name='receipt',  # donation.receipt gives the receipt
        help_text='The donation this receipt is for'
    )
    receipt_number = models.CharField(
        max_length=20,
        unique=True,  # UNIQUE constraint — no duplicate receipt numbers
        help_text='Unique receipt number, e.g., GCH-2026-0001'
    )
    festival = models.ForeignKey(
        'festivals.Festival',
        on_delete=models.PROTECT,
        related_name='receipts',
        help_text='Festival year (denormalized for faster receipt queries)'
    )
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='generated_receipts',
        null=True, blank=True,
    )

    class Meta:
        db_table = 'receipts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['receipt_number'], name='idx_receipt_number'),
        ]

    def __str__(self):
        return self.receipt_number
