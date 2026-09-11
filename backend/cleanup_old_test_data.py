"""
Database Cleanup Script
Removes obsolete test admin accounts (e.g., 'Manohar admin', 'manohar') and orphan test data.
"""

import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from donations.models import Donation
from expenses.models import Expense
from planning.models import PlannedExpense
from donors.models import Donor

User = get_user_model()

def cleanup():
    print("Cleaning up obsolete test accounts and orphan demo data...")

    # Look for obsolete test users
    test_users = User.objects.filter(
        username__icontains='manohar'
    ) | User.objects.filter(
        full_name__icontains='manohar'
    )

    deleted_count = 0
    for u in test_users:
        print(f"Deleting user: {u.username} ({u.full_name})")
        # Remove associated donations/expenses created by this user
        Donation.objects.filter(collected_by=u).delete()
        Expense.objects.filter(paid_by=u).delete()
        u.delete()
        deleted_count += 1

    print(f"Cleanup complete: Removed {deleted_count} test account(s).")

if __name__ == '__main__':
    cleanup()
