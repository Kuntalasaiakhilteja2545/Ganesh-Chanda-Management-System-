"""
Fresh Application Reset Script

WHAT: Wipes all test transaction data and starts with an empty slate:
- 0 donations
- 0 expenses
- 0 donors
- 0 youth committee members (ready to add fresh)
- 3 standard user accounts: admin, treasurer, collector
- 15 standard bilingual Expense Categories
- 1 pristine active Festival
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from festivals.models import Festival, CommitteeMember
from donors.models import Donor
from donations.models import Donation, Receipt
from expenses.models import ExpenseCategory, Expense
from planning.models import PlannedExpense
from audit.models import AuditLog

User = get_user_model()

def reset_fresh():
    print(">>> Cleaning all data...")

    # 1. Clear all transaction & custom data
    Receipt.objects.all().delete()
    Donation.objects.all().delete()
    Donor.objects.all().delete()
    Expense.objects.all().delete()
    PlannedExpense.objects.all().delete()
    AuditLog.objects.all().delete()
    CommitteeMember.objects.all().delete()
    Festival.objects.all().delete()

    print("[OK] Cleared all donations, receipts, expenses, donors, and committee members.")

    # 2. Setup Default Users
    print("\n>>> Creating default user accounts...")
    users = [
        ('admin', 'admin@ganeshchanda.org', 'admin123', 'Admin Officer', 'ADMIN', True),
        ('treasurer', 'treasurer@ganeshchanda.org', 'treasurer123', 'K. Ravi Kumar (Treasurer)', 'TREASURER', False),
        ('collector', 'collector@ganeshchanda.org', 'collector123', 'G. Akhil Kumar (Collector)', 'COLLECTOR', False),
    ]

    for username, email, pwd, name, role, is_super in users:
        u, created = User.objects.get_or_create(username=username, defaults={'email': email, 'full_name': name, 'role': role})
        u.set_password(pwd)
        u.is_superuser = is_super
        u.is_staff = is_super
        u.role = role
        u.full_name = name
        u.save()
        status = "Created" if created else "Reset password for"
        print(f"   * {status}: {username} ({role}) / Password: {pwd}")

    # 3. Setup 15 Standard Bilingual Categories
    print("\n>>> Seeding 15 standard expense categories...")
    categories = [
        ('Ganesh Idol', 'గణేష్ విగ్రహం', 1),
        ('Decoration', 'అలంకరణ', 2),
        ('Flowers', 'పూలు', 3),
        ('Lighting', 'లైటింగ్', 4),
        ('Electrical', 'విద్యుత్', 5),
        ('Sound System', 'సౌండ్ సిస్టమ్', 6),
        ('Pooja Materials', 'పూజా సామగ్రి', 7),
        ('Food & Annadanam', 'అన్నదానం & భోజనం', 8),
        ('Water & Refreshments', 'మంచినీళ్ళు & పానీయాలు', 9),
        ('Transportation', 'రవాణా', 10),
        ('Printing & Banners', 'ముద్రణ & బ్యానర్లు', 11),
        ('Cleaning & Sanitation', 'శుభ్రపరచడం', 12),
        ('Prasadam', 'ప్రసాదం', 13),
        ('Cultural Program', 'సాంస్కృతిక కార్యక్రమం', 14),
        ('Miscellaneous', 'ఇతర ఖర్చులు', 15),
    ]

    ExpenseCategory.objects.all().delete()
    for name, name_te, order in categories:
        ExpenseCategory.objects.create(name=name, name_telugu=name_te, display_order=order)
    print(f"   * Seeded {len(categories)} categories.")

    # 4. Create Active Festival & Association (with 0 committee members)
    print("\n>>> Creating pristine active festival season...")
    festival = Festival.objects.create(
        name='Ganesh Chanda 2026',
        name_telugu='గణేష్ చందా 2026',
        association_name='Jai Hind Ganesh Youth Association',
        association_name_telugu='జై హింద్ గణేష్ యువజన సంఘం',
        year=2026,
        start_date='2026-08-01',
        end_date='2026-09-15',
        location='Main Colony Road, Ameerpet, Hyderabad',
        landmark='Opposite Community Hall Stage',
        upi_id='ganeshyouth@phonepe',
        is_active=True,
    )
    print(f"   * Active Festival: {festival.name} ({festival.association_name})")
    print("   * Committee Members: 0 (Ready for adding fresh names)")

    print("\n=======================================================")
    print("SUCCESS: 100% CLEAN SLATE CREATED FOR CLIENT DEMO!")
    print("=======================================================")

if __name__ == '__main__':
    reset_fresh()
