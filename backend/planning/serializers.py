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
    festival = serializers.PrimaryKeyRelatedField(
        queryset=PlannedExpense._meta.get_field('festival').remote_field.model.objects.all(),
        required=False,
        allow_null=True
    )
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
        self.fields['category'].required = False
        self.validators = []  # Allow view create() to handle upsert for existing (festival, category)

    def validate(self, attrs):
        if not attrs.get('festival'):
            from festivals.models import Festival
            from datetime import datetime
            active = Festival.objects.filter(is_active=True).first() or Festival.objects.first()
            if not active:
                active = Festival.objects.create(
                    name=f"Ganesh Chanda {datetime.now().year}",
                    association_name="Ganesh Youth Association",
                    year=datetime.now().year,
                    is_active=True
                )
            attrs['festival'] = active
        return attrs

    def validate_category(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError('Category is not active.')
        return value
