from rest_framework import serializers
from .models import PlannedExpense


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
