from django.test import TestCase
from decimal import Decimal
from datetime import date
from accounts.models import User
from festivals.models import Festival
from donors.models import Donor
from donations.models import Donation
from expenses.models import Expense, ExpenseCategory
from audit.models import AuditLog


class AuditLogTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='password123',
            full_name='Test Admin',
            role='ADMIN',
        )
        self.festival = Festival.objects.create(
            name='Ganesh Chanda 2026',
            year=2026,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 11),
            is_active=True,
        )
        self.donor = Donor.objects.create(
            name='Srinivas Rao',
            mobile_number='9876543210',
        )

    def test_donation_create_and_update_logged(self):
        # 1. Test CREATE
        donation = Donation.objects.create(
            festival=self.festival,
            donor=self.donor,
            amount=Decimal('1116.00'),
            payment_method='CASH',
            donation_date=date(2026, 9, 2),
            collected_by=self.user,
        )

        create_log = AuditLog.objects.filter(model_name='Donation', record_id=donation.pk, action='CREATE').first()
        self.assertIsNotNone(create_log)
        self.assertEqual(create_log.new_values['amount'], '1116.00')

        # 2. Test UPDATE
        donation.amount = Decimal('2116.00')
        donation.save()

        update_log = AuditLog.objects.filter(model_name='Donation', record_id=donation.pk, action='UPDATE').first()
        self.assertIsNotNone(update_log)
        self.assertEqual(update_log.old_values['amount'], '1116.00')
        self.assertEqual(update_log.new_values['amount'], '2116.00')

    def test_expense_create_and_delete_logged(self):
        category = ExpenseCategory.objects.create(name='Pooja Materials')
        expense = Expense.objects.create(
            festival=self.festival,
            category=category,
            description='Flowers and Pooja Samagri',
            amount=Decimal('500.00'),
            expense_date=date(2026, 9, 3),
            paid_by=self.user,
        )

        create_log = AuditLog.objects.filter(model_name='Expense', record_id=expense.pk, action='CREATE').first()
        self.assertIsNotNone(create_log)

        # Test DELETE
        exp_id = expense.pk
        expense.delete()

        delete_log = AuditLog.objects.filter(model_name='Expense', record_id=exp_id, action='DELETE').first()
        self.assertIsNotNone(delete_log)
