"""
Expense Serializers
"""

from rest_framework import serializers
from .models import ExpenseCategory, Expense


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = [
            'id', 'name', 'name_telugu', 'description',
            'is_active', 'display_order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """Output serializer — includes human-readable names."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    festival_name = serializers.CharField(source='festival.name', read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    pending_balance = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id',
            'festival', 'festival_name',
            'category', 'category_name',
            'description',
            'amount',
            'total_estimated_amount',
            'payment_status',
            'payment_status_display',
            'pending_balance',
            'vendor_name',
            'vendor_contact',
            'payment_method', 'payment_method_display',
            'transaction_id',
            'paid_by', 'paid_by_name',
            'expense_date',
            'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'paid_by', 'created_at', 'updated_at']

    def get_pending_balance(self, obj):
        if obj.total_estimated_amount and obj.total_estimated_amount > obj.amount:
            return str(obj.total_estimated_amount - obj.amount)
        return '0.00'


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Input serializer for creating expenses."""
    category = serializers.PrimaryKeyRelatedField(
        queryset=ExpenseCategory.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    category_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Expense
        fields = [
            'festival', 'category', 'category_name', 'description',
            'amount', 'total_estimated_amount', 'payment_status',
            'vendor_name', 'vendor_contact',
            'payment_method', 'transaction_id', 'expense_date', 'notes',
        ]

    def validate_category(self, value):
        """Ensure category exists and is active."""
        if value and not value.is_active:
            raise serializers.ValidationError('Category is not active.')
        return value

    def validate(self, attrs):
        """Ensure at least category or category_name is provided, and category exists."""
        category = attrs.get('category')
        category_name = attrs.get('category_name', '').strip()

        if not category and not category_name:
            raise serializers.ValidationError({
                'category': 'Either category ID or category_name must be provided.'
            })

        if not category and category_name:
            # Check if category exists by name
            existing = ExpenseCategory.objects.filter(name__iexact=category_name, is_active=True).first()
            if not existing:
                raise serializers.ValidationError({
                    'category_name': f'Category "{category_name}" does not exist. Contact admin to create it.'
                })
        return attrs
