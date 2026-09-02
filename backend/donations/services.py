"""
Donation Service Layer

WHAT: Contains business logic that is TOO COMPLEX for the ViewSet.

WHY A SERVICE LAYER:
    ViewSets should handle HTTP (request/response).
    Services should handle BUSINESS LOGIC (create donation + generate receipt + audit log).
    
    If you put everything in the ViewSet, it becomes a 500-line monster.
    Services are also REUSABLE — the same logic can be called from
    management commands, tests, or background tasks.

WHAT THIS SERVICE DOES:
    1. Validate the donation data
    2. Generate a unique receipt number (GCH-2026-0001)
    3. Save donation + receipt in ONE database transaction
    4. If anything fails → rollback (no orphan records)

DATABASE TRANSACTION:
    Without a transaction:
        Step 1: Save donation → OK
        Step 2: Generate receipt → FAILS (e.g., duplicate receipt number)
        Result: Donation exists WITHOUT a receipt → BAD!
    
    With a transaction:
        Step 1: Save donation → OK
        Step 2: Generate receipt → FAILS
        Result: BOTH rolled back → database stays consistent → GOOD!
"""

from django.db import transaction
from django.db.models import Max

from common.constants import RECEIPT_PREFIX
from .models import Donation, Receipt


def generate_receipt_number(festival):
    """
    Generate the next unique receipt number for a festival.

    FORMAT: GCH-{YEAR}-{SEQUENTIAL_4_DIGIT}

    Example sequence:
        GCH-2026-0001
        GCH-2026-0002
        GCH-2026-0003

    HOW:
        1. Find the highest receipt number for this festival
        2. Extract the sequence number
        3. Add 1
        4. Format with zero-padding

    THREAD SAFETY:
        This runs inside a database transaction with select_for_update()
        to prevent two concurrent requests from generating the same number.
    """
    prefix = f"{RECEIPT_PREFIX}-{festival.year}-"

    # Find the latest receipt number for this festival
    # Use select_for_update() to lock the relevant rows and prevent race conditions
    last_receipt = (
        Receipt.objects
        .filter(festival=festival)
        .select_for_update()
        .order_by('-receipt_number')
        .values_list('receipt_number', flat=True)
        .first()
    )
    
    if last_receipt:
        # Extract the sequence number: "GCH-2026-0003" → 3
        try:
            last_seq = int(last_receipt.split('-')[-1])
        except (ValueError, IndexError):
            last_seq = 0
        next_seq = last_seq + 1
    else:
        next_seq = 1
    
    return f"{prefix}{next_seq:04d}"


@transaction.atomic
def create_donation_with_receipt(validated_data, user):
    """
    Create a donation AND its receipt in one atomic transaction.
    """
    data = dict(validated_data)
    donor = data.pop('donor', None)
    donor_name = data.pop('donor_name', '').strip()
    donor_mobile = data.pop('donor_mobile', '').strip()
    donor_address = data.pop('donor_address', '').strip()

    if not donor:
        from donors.models import Donor
        if not donor_name:
            donor_name = "Devotee"
        
        if donor_mobile:
            donor, _ = Donor.objects.get_or_create(
                mobile_number=donor_mobile,
                defaults={'name': donor_name, 'address': donor_address}
            )
            if donor.name != donor_name or (donor_address and donor.address != donor_address):
                donor.name = donor_name
                if donor_address:
                    donor.address = donor_address
                donor.save()
        else:
            donor = Donor.objects.create(
                name=donor_name,
                address=donor_address
            )

    # Step 1: Create donation
    donation = Donation.objects.create(
        donor=donor,
        collected_by=user,
        **data
    )
    
    # Step 2: Generate unique receipt number
    receipt_number = generate_receipt_number(donation.festival)
    
    # Step 3: Create receipt
    Receipt.objects.create(
        donation=donation,
        receipt_number=receipt_number,
        festival=donation.festival,
        generated_by=user,
    )
    
    return donation
