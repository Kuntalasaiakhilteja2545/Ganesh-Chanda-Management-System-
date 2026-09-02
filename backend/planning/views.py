"""
Planning ViewSet with @action for planned-vs-actual and projected balance.
"""

from decimal import Decimal
from django.db.models import Sum
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsTreasurerOrAbove
from donations.models import Donation
from expenses.models import Expense, ExpenseCategory
from festivals.models import Festival
from .models import PlannedExpense
from .serializers import PlannedExpenseSerializer


class PlannedExpenseViewSet(ModelViewSet):
    """
    Budget/planned expense CRUD + summary actions.

    CRUD:
        GET/POST   /api/planning/
        GET/PATCH  /api/planning/{id}/
    """
    serializer_class = PlannedExpenseSerializer
    permission_classes = [IsTreasurerOrAbove]
    filterset_fields = ['festival', 'category']

    def get_queryset(self):
        return PlannedExpense.objects.select_related('category', 'festival').all()

    def create(self, request, *args, **kwargs):
        """
        Upsert budget: If budget for (festival, category) already exists,
        update it instead of throwing unique constraint error.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        festival = serializer.validated_data['festival']
        category = serializer.validated_data['category']

        instance = PlannedExpense.objects.filter(festival=festival, category=category).first()
        if instance:
            instance.planned_amount = serializer.validated_data.get('planned_amount', instance.planned_amount)
            instance.description = serializer.validated_data.get('description', instance.description)
            instance.notes = serializer.validated_data.get('notes', instance.notes)
            instance.save()
            return Response(PlannedExpenseSerializer(instance).data, status=status.HTTP_200_OK)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        GET /api/planning/summary/?festival_id=1

        Returns planned vs actual for each category + projected balance.
        Includes id, category_id, category names, planned amount, and actual spending.
        """
        festival_id = request.query_params.get('festival_id')
        if not festival_id:
            festival = Festival.objects.filter(is_active=True).first()
            if not festival:
                return Response({'message': 'No active festival'}, status=404)
            festival_id = festival.id

        # Get all planned expenses for this festival
        plans = {
            p.category_id: p
            for p in PlannedExpense.objects.filter(festival_id=festival_id).select_related('category')
        }

        # Get actual amounts grouped by category_id
        actual_by_cat = {
            e['category_id']: e['total']
            for e in Expense.objects.filter(festival_id=festival_id)
            .values('category_id')
            .annotate(total=Sum('amount'))
        }

        # Collect all active category IDs that have plans or expenses
        all_cat_ids = sorted(set(list(plans.keys()) + list(actual_by_cat.keys())))
        all_categories = {c.id: c for c in ExpenseCategory.objects.filter(id__in=all_cat_ids)}

        comparison = []
        total_planned = Decimal('0')
        total_actual = Decimal('0')

        for cat_id in all_cat_ids:
            cat = all_categories.get(cat_id)
            cat_name = cat.name if cat else f"Category #{cat_id}"
            cat_telugu = cat.name_telugu if cat else ''

            plan = plans.get(cat_id)
            p_amount = plan.planned_amount if plan else Decimal('0')
            p_id = plan.id if plan else None
            p_desc = plan.description if plan else ''

            a_amount = actual_by_cat.get(cat_id, Decimal('0'))

            total_planned += p_amount
            total_actual += a_amount

            diff = p_amount - a_amount
            comparison.append({
                'id': p_id,
                'category_id': cat_id,
                'category': cat_name,
                'category_telugu': cat_telugu,
                'description': p_desc,
                'planned': str(p_amount),
                'actual': str(a_amount),
                'difference': str(diff),
                'remaining': str(max(diff, Decimal('0'))),
            })

        # Sort comparison by category name
        comparison.sort(key=lambda x: x['category'])

        # Projected balance calculations
        total_donations = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED'
        ).aggregate(t=Sum('amount', default=Decimal('0')))['t']

        current_balance = total_donations - total_actual
        remaining_planned = total_planned - total_actual
        projected_balance = current_balance - max(remaining_planned, Decimal('0'))

        return Response({
            'comparison': comparison,
            'total_planned': str(total_planned),
            'total_actual': str(total_actual),
            'total_donations': str(total_donations),
            'current_balance': str(current_balance),
            'remaining_planned': str(max(remaining_planned, Decimal('0'))),
            'projected_balance': str(projected_balance),
            'warning': 'Planned expenses exceed available balance!' if projected_balance < 0 else None,
        })
