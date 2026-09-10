from rest_framework import serializers
from .models import PlannedExpense
from expenses.models import ExpenseCategory


class PlannedExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    festival_name = serializers.CharField(source='festival.name', read_only=True)

    class Meta:
        model = PlannedExpense
        fields = [
            'id', 'festival', 'festival_name', 'category', 'category_name',
            'description', 'planned_amount', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlannedExpenseCreateSerializer(serializers.ModelSerializer):
    """Input serializer for creating planned expenses with category_name support."""
    category = serializers.PrimaryKeyRelatedField(
        queryset=ExpenseCategory.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    category_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PlannedExpense
        fields = [
            'festival', 'category', 'category_name', 'description', 'planned_amount', 'notes',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ensure category field is not required (model has blank=False but we handle fallback in view)
        self.fields['category'].required = False

    def validate(self, attrs):
        """Pass through category data — view handles lookup/auto-creation."""
        return attrs

    def validate_category(self, value):
        """Override to allow category to be optional."""
        if value and not value.is_active:
            raise serializers.ValidationError('Category is not active.')
        return value
