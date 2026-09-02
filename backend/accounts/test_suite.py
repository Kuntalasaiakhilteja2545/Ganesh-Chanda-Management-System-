import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from festivals.models import Festival
from donors.models import Donor
from donations.models import Donation, Receipt
from expenses.models import ExpenseCategory, Expense
from planning.models import PlannedExpense


class GaneshChandaSystemTests(APITestCase):
    def setUp(self):
        # 1. Create Admin
        self.admin = User.objects.create_superuser(
            username='test_admin',
            email='admin@test.com',
            password='password123',
            full_name='Test Admin',
            role='ADMIN',
        )

        # 2. Create Collector
        self.collector = User.objects.create_user(
            username='test_collector',
            email='collector@test.com',
            password='password123',
            full_name='Test Collector',
            role='COLLECTOR',
        )

        # 3. Create Festival
        self.festival = Festival.objects.create(
            name='Test Ganesh Chanda 2026',
            name_telugu='టెస్ట్ గణేష్ చందా 2026',
            year=2099,
            is_active=True,
        )

        # 4. Create Category
        self.category = ExpenseCategory.objects.create(
            name='Decoration Test',
            display_order=1,
        )

    def test_jwt_auth_and_roles(self):
        # Login
        response = self.client.post('/api/auth/login/', {
            'username': 'test_collector',
            'password': 'password123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['role'], 'COLLECTOR')

    def test_donation_and_receipt_creation(self):
        # Authenticate collector
        self.client.force_authenticate(user=self.collector)

        # Create donor
        donor = Donor.objects.create(name='Devotee Ramesh', mobile_number='9876543210')

        # Create donation
        response = self.client.post('/api/donations/', {
            'festival': self.festival.id,
            'donor': donor.id,
            'amount': '2500.00',
            'payment_method': 'PHONEPE',
            'transaction_id': 'TXN99999',
            'donation_date': '2026-08-16',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['amount'], '2500.00')
        self.assertTrue(response.data['receipt']['receipt_number'].startswith('GCH-2099-'))

        # Check DB
        donation = Donation.objects.get(id=response.data['id'])
        self.assertEqual(donation.amount, Decimal('2500.00'))
        self.assertEqual(donation.collected_by, self.collector)
        self.assertIsNotNone(donation.receipt)

    def test_expense_creation_and_dashboard_summary(self):
        self.client.force_authenticate(user=self.admin)

        donor = Donor.objects.create(name='Devotee Ramesh')
        Donation.objects.create(
            festival=self.festival,
            donor=donor,
            amount=Decimal('5000.00'),
            collected_by=self.collector,
            donation_date='2026-08-16',
        )

        # Create expense
        Expense.objects.create(
            festival=self.festival,
            category=self.category,
            description='Test Stage flowers',
            amount=Decimal('1500.00'),
            paid_by=self.admin,
            expense_date='2026-08-16',
        )

        # Query Dashboard summary
        response = self.client.get(f'/api/dashboard/summary/?festival_id={self.festival.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_donations'], '5000.00')
        self.assertEqual(response.data['total_expenses'], '1500.00')
        self.assertEqual(response.data['balance'], '3500.00')

    def test_public_dashboard_no_auth_required(self):
        response = self.client.get(f'/api/public/dashboard/?festival_id={self.festival.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['festival']['name'], self.festival.name)

    # ── Forgot Username Tests ──

    def test_forgot_username_success(self):
        """User can recover their username by entering their registered mobile number."""
        # Give the collector a mobile number
        self.collector.mobile_number = '9999888877'
        self.collector.save()

        response = self.client.post('/api/auth/forgot-username/', {
            'mobile_number': '9999888877',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Username should be partially masked (not the full username)
        self.assertIn('username', response.data)
        self.assertIn('*', response.data['username'])

    def test_forgot_username_not_found(self):
        """Returns 404 if no user has the given mobile number."""
        response = self.client.post('/api/auth/forgot-username/', {
            'mobile_number': '0000000000',
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])

    def test_forgot_username_missing_mobile(self):
        """Returns 400 if mobile_number is not provided."""
        response = self.client.post('/api/auth/forgot-username/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Reset Password Tests ──

    def test_reset_password_success(self):
        """User can reset password with correct username + mobile number."""
        self.collector.mobile_number = '9999888877'
        self.collector.save()

        response = self.client.post('/api/auth/reset-password/', {
            'username': 'test_collector',
            'mobile_number': '9999888877',
            'new_password': 'NewSecurePass99!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Verify the password actually changed — try to login with the new password
        login_response = self.client.post('/api/auth/login/', {
            'username': 'test_collector',
            'password': 'NewSecurePass99!',
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    def test_reset_password_wrong_mobile(self):
        """Returns 400 if the username + mobile combination doesn't match."""
        self.collector.mobile_number = '9999888877'
        self.collector.save()

        response = self.client.post('/api/auth/reset-password/', {
            'username': 'test_collector',
            'mobile_number': '1111111111',  # Wrong mobile
            'new_password': 'NewSecurePass99!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_reset_password_weak_password(self):
        """Returns 400 if the new password doesn't pass Django validators."""
        self.collector.mobile_number = '9999888877'
        self.collector.save()

        response = self.client.post('/api/auth/reset-password/', {
            'username': 'test_collector',
            'mobile_number': '9999888877',
            'new_password': '123',  # Too short / too common
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_missing_fields(self):
        """Returns 400 if required fields are missing."""
        response = self.client.post('/api/auth/reset-password/', {
            'username': 'test_collector',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

