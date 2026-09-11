"""
Expense ViewSets — same pattern as Donation/Festival/Donor.
"""

from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response

from accounts.permissions import IsAdmin, IsTreasurerOrAbove, IsAdminOrReadOnly, IsCollectorOrAbove
from .models import ExpenseCategory, Expense
from .serializers import ExpenseCategorySerializer, ExpenseSerializer, ExpenseCreateSerializer


class ExpenseCategoryViewSet(ModelViewSet):
    """
    Expense Category CRUD.
    
    GET    /api/expense-categories/       → list all categories
    POST   /api/expense-categories/       → create (admin only)
    PATCH  /api/expense-categories/1/     → update (admin only)
    
    Anyone authenticated can VIEW categories (for dropdowns).
    Only ADMIN can create/edit categories.
    """
    queryset = ExpenseCategory.objects.filter(is_active=True)
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None  # No pagination — categories are few, always return all


class ExpenseViewSet(ModelViewSet):
    """
    Expense CRUD.
    
    GET    /api/expenses/       → list expenses
    POST   /api/expenses/       → create (treasurer+)
    PATCH  /api/expenses/1/     → update (treasurer+)
    DELETE /api/expenses/1/     → soft delete (admin only)
    """
    serializer_class = ExpenseSerializer
    search_fields = ['description', 'category__name', 'vendor_name']
    ordering_fields = ['expense_date', 'amount', 'created_at']
    filterset_fields = ['festival', 'category', 'payment_method', 'payment_status', 'paid_by', 'expense_date']

    def get_queryset(self):
        qs = (
            Expense.objects
            .select_related('category', 'festival', 'paid_by')
            .all()
        )
        if self.request.user and self.request.user.is_authenticated and getattr(self.request.user, 'association_name', None):
            qs = qs.filter(festival__association_name__iexact=self.request.user.association_name.strip())
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update']:
            return [IsCollectorOrAbove()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        """Use input serializer for validation, output serializer for response."""
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = dict(input_serializer.validated_data)
        category = data.pop('category', None)
        category_name = data.pop('category_name', '').strip()

        if not category:
            if not category_name:
                category_name = "General Expense"
            # Look up existing or auto-create new category
            category = ExpenseCategory.objects.filter(name__iexact=category_name, is_active=True).first()
            if not category:
                category = ExpenseCategory.objects.create(name=category_name, is_active=True)

        expense = Expense.objects.create(
            category=category,
            paid_by=request.user,
            **data
        )

        output_serializer = ExpenseSerializer(expense)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        category_name = request.data.get('category_name', '').strip() if isinstance(request.data, dict) else ''
        if category_name and not request.data.get('category'):
            # Look up existing or auto-create new category
            category = ExpenseCategory.objects.filter(name__iexact=category_name, is_active=True).first()
            if not category:
                category = ExpenseCategory.objects.create(name=category_name, is_active=True)
            instance.category = category

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        output_serializer = ExpenseSerializer(instance)
        return Response(output_serializer.data)

    def perform_destroy(self, instance):
        instance.soft_delete()
