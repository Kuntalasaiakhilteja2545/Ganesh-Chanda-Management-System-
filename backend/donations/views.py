"""
Donation ViewSet

THE MOST IMPORTANT VIEWSET — demonstrates key ModelViewSet concepts:

1. get_serializer_class() — use DIFFERENT serializers for input vs output
2. perform_create()       — hook into CREATE to add business logic
3. get_queryset()         — dynamic filtering (collectors see only their own)
4. get_permissions()      — role-based access control
5. select_related()       — optimize database queries (prevent N+1)

N+1 PROBLEM EXPLAINED:
    Without select_related:
        GET /api/donations/  (20 donations)
        → 1 query for donations
        → 20 queries for donor names (one per donation)
        → 20 queries for festival names
        → 20 queries for collector names
        = 61 queries! SLOW!
    
    With select_related:
        → 1 query that JOINs all related tables
        = 1 query! FAST!
"""

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsCollectorOrAbove, IsTreasurerOrAbove, IsAdmin
from common.constants import Roles
from .models import Donation
from .serializers import DonationSerializer, DonationCreateSerializer
from .services import create_donation_with_receipt


class DonationViewSet(ModelViewSet):
    """
    Donation CRUD with receipt auto-generation.
    
    GET    /api/donations/       → list donations
    POST   /api/donations/       → create donation + auto-generate receipt
    GET    /api/donations/1/     → get donation #1
    PATCH  /api/donations/1/     → update donation
    DELETE /api/donations/1/     → soft delete
    
    Search: GET /api/donations/?search=Ravi
    Filter: GET /api/donations/?festival=1&payment_method=CASH
    """
    serializer_class = DonationSerializer
    search_fields = ['donor__name', 'receipt__receipt_number', 'transaction_id']
    ordering_fields = ['donation_date', 'amount', 'created_at']
    filterset_fields = ['festival', 'payment_method', 'status', 'collected_by', 'donation_date']

    def get_queryset(self):
        """
        Dynamic queryset — different users see different data.
        
        ADMIN/TREASURER: See ALL donations
        COLLECTOR: See ONLY their own collected donations
        
        select_related() JOINs related tables in ONE query.
        """
        queryset = (
            Donation.objects
            .select_related('donor', 'festival', 'collected_by', 'receipt')
            .all()
        )

        # Collectors can only see their own donations
        if self.request.user.role == Roles.COLLECTOR:
            queryset = queryset.filter(collected_by=self.request.user)

        return queryset

    def get_serializer_class(self):
        """
        Use DonationCreateSerializer for POST (input).
        Use DonationSerializer for everything else (output).
        
        WHY: Input needs IDs (festival=1, donor=15).
             Output needs names (festival_name="Ganesh Chanda 2026").
        """
        if self.action == 'create':
            return DonationCreateSerializer
        return DonationSerializer

    def get_permissions(self):
        """
        Any committee member can add/view donations.
        Treasurer+ can edit. Admin only can delete.
        """
        if self.action in ['list', 'retrieve', 'create']:
            return [IsCollectorOrAbove()]
        if self.action in ['update', 'partial_update']:
            return [IsTreasurerOrAbove()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        """
        Override create() to use DonationCreateSerializer for INPUT
        but DonationSerializer for OUTPUT (so the response includes
        receipt, donor_name, etc.).
        
        DEFAULT ModelViewSet.create() flow:
            1. get_serializer(data=request.data)  → DonationCreateSerializer
            2. serializer.is_valid()
            3. perform_create(serializer)  → saves to DB
            4. return Response(serializer.data)  → uses SAME serializer for output
        
        OUR override:
            Same steps 1-3, but step 4 uses DonationSerializer for the response.
        """
        from rest_framework import status
        from rest_framework.response import Response

        # Step 1-2: Validate input
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        # Step 3: Create donation + receipt via service layer
        donation = create_donation_with_receipt(
            validated_data=input_serializer.validated_data,
            user=request.user
        )

        # Step 4: Return full output with receipt, donor_name, etc.
        output_serializer = DonationSerializer(donation)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete."""
        instance.soft_delete()

