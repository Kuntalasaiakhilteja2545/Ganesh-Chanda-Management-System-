"""
Donation Serializers
"""

from rest_framework import serializers
from common.constants import PaymentMethods
from .models import Donation, Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    """Receipt info — nested inside DonationSerializer output."""

    class Meta:
        model = Receipt
        fields = ['id', 'receipt_number', 'created_at']
        read_only_fields = ['id', 'receipt_number', 'created_at']


class DonationSerializer(serializers.ModelSerializer):
    """
    OUTPUT serializer — used for GET responses.
    
    Shows human-readable names for foreign keys:
        "donor_name": "Ravi Kumar"  (not just "donor": 1)
        "collected_by_name": "Akhil Kumar"
        "festival_name": "Ganesh Chanda 2026"
    
    Also nests the receipt info:
        "receipt": { "receipt_number": "GCH-2026-0001" }
    
    WHY SEPARATE INPUT/OUTPUT SERIALIZERS:
        INPUT needs: festival=1, donor=15 (IDs for foreign keys)
        OUTPUT needs: festival_name="Ganesh Chanda 2026" (human-readable)
        Using one serializer for both is messy.
    """
    donor_name = serializers.CharField(source='donor.name', read_only=True)
    donor_mobile = serializers.CharField(source='donor.mobile_number', read_only=True)
    donor_address = serializers.CharField(source='donor.address', read_only=True)
    festival_name = serializers.CharField(source='festival.name', read_only=True)
    festival_year = serializers.IntegerField(source='festival.year', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    donation_type_display = serializers.CharField(source='get_donation_type_display', read_only=True)
    receipt = ReceiptSerializer(read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'festival',
            'festival_name',
            'festival_year',
            'donor',
            'donor_name',
            'donor_mobile',
            'donor_address',
            'amount',
            'payment_method',
            'payment_method_display',
            'transaction_id',
            'payment_app',
            'donation_type',
            'donation_type_display',
            'auction_item',
            'collected_by',
            'collected_by_name',
            'collector_member_name',
            'donation_date',
            'status',
            'notes',
            'receipt',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'collected_by', 'collected_by_name',
            'created_at', 'updated_at',
        ]


class DonationCreateSerializer(serializers.ModelSerializer):
    """
    INPUT serializer — used for POST (creating donations).
    Supports either donor ID or direct donor_name, donor_mobile, donor_address.
    """
    festival = serializers.PrimaryKeyRelatedField(
        queryset=Donation._meta.get_field('festival').remote_field.model.objects.all(),
        required=False,
        allow_null=True
    )
    donor = serializers.PrimaryKeyRelatedField(
        queryset=Donation._meta.get_field('donor').remote_field.model.objects.all(),
        required=False,
        allow_null=True
    )
    donor_name = serializers.CharField(required=False, allow_blank=True)
    donor_mobile = serializers.CharField(required=False, allow_blank=True)
    donor_address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Donation
        fields = [
            'festival',
            'donor',
            'donor_name',
            'donor_mobile',
            'donor_address',
            'amount',
            'payment_method',
            'transaction_id',
            'payment_app',
            'donation_type',
            'auction_item',
            'collector_member_name',
            'donation_date',
            'notes',
        ]

    def validate(self, data):
        if not data.get('festival'):
            from festivals.models import Festival
            from datetime import datetime
            request = self.context.get('request')
            user_assoc = getattr(request.user, 'association_name', '') if request and request.user else ''
            qs = Festival.objects.all()
            if user_assoc:
                qs = qs.filter(association_name__iexact=user_assoc.strip())
            active = qs.filter(is_active=True).first() or qs.first()
            if not active:
                active = Festival.objects.create(
                    name=f"Ganesh Chanda {datetime.now().year}",
                    association_name=user_assoc or "Ganesh Youth Association",
                    year=datetime.now().year,
                    is_active=True
                )
            data['festival'] = active

        payment_method = data.get('payment_method')
        transaction_id = data.get('transaction_id', '')

        if payment_method in PaymentMethods.DIGITAL_METHODS and not transaction_id:
            pass

        return data
