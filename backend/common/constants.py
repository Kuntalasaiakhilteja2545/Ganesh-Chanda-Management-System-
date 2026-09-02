"""
Common Constants

WHAT: Central place for all constant values used across the application.
WHY:  Instead of scattering strings like 'CASH', 'PHONEPE' across 10 different files,
      we define them ONCE here. This prevents typos and makes changes easy.
WHERE: Imported by models, serializers, views, and services across all apps.

REAL-WORLD EXAMPLE:
    If we ever add a new payment method (e.g., 'PAYTM'), we add it here ONCE,
    and every model/serializer/view that references PAYMENT_METHOD_CHOICES
    automatically picks it up.

COMMON MISTAKE:
    Hard-coding 'CASH' in models.py, 'Cash' in serializers.py, 'cash' in views.py
    → leads to bugs when they don't match. Always use constants.
"""


# =============================================================================
# USER ROLES
# =============================================================================
# These map to the 'role' field on our custom User model.
# The first value is stored in the database. The second is the human-readable label.
class Roles:
    ADMIN = 'ADMIN'
    TREASURER = 'TREASURER'
    COLLECTOR = 'COLLECTOR'

    CHOICES = [
        (ADMIN, 'Admin'),
        (TREASURER, 'Treasurer'),
        (COLLECTOR, 'Collector'),
    ]


# =============================================================================
# PAYMENT METHODS
# =============================================================================
# Used by both Donation and Expense models.
class PaymentMethods:
    CASH = 'CASH'
    PHONEPE = 'PHONEPE'
    GOOGLE_PAY = 'GPAY'
    UPI = 'UPI'
    QR = 'QR'
    BANK_TRANSFER = 'BANK'
    OTHER = 'OTHER'

    CHOICES = [
        (CASH, 'Cash'),
        (PHONEPE, 'PhonePe'),
        (GOOGLE_PAY, 'Google Pay'),
        (UPI, 'UPI'),
        (QR, 'QR Code'),
        (BANK_TRANSFER, 'Bank Transfer'),
        (OTHER, 'Other'),
    ]

    # Payment methods that require a transaction/reference ID
    DIGITAL_METHODS = [PHONEPE, GOOGLE_PAY, UPI, QR, BANK_TRANSFER]


# =============================================================================
# DONATION STATUS
# =============================================================================
class DonationStatus:
    CONFIRMED = 'CONFIRMED'
    PENDING = 'PENDING'
    CANCELLED = 'CANCELLED'

    CHOICES = [
        (CONFIRMED, 'Confirmed'),
        (PENDING, 'Pending'),
        (CANCELLED, 'Cancelled'),
    ]


# =============================================================================
# RECEIPT PREFIX
# =============================================================================
RECEIPT_PREFIX = 'GCH'
