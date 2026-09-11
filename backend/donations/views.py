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
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

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
    filterset_fields = ['payment_method', 'status', 'collected_by', 'donation_date']

    def get_queryset(self):
        from django.db.models import Q
        queryset = (
            Donation.objects
            .select_related('donor', 'festival', 'collected_by', 'receipt')
            .all()
        )

        user = self.request.user
        if user and user.is_authenticated:
            user_assoc = getattr(user, 'association_name', '')
            if user_assoc:
                queryset = queryset.filter(
                    Q(festival__association_name__iexact=user_assoc.strip()) |
                    Q(collected_by=user)
                )

        festival_id = self.request.query_params.get('festival')
        if festival_id:
            if queryset.filter(festival_id=festival_id).exists():
                queryset = queryset.filter(festival_id=festival_id)

        # Collectors can only see their own donations
        if user and getattr(user, 'role', None) == Roles.COLLECTOR:
            queryset = queryset.filter(collected_by=user)

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
        if self.action in ['auction_leaderboard']:
            return [AllowAny()]
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update']:
            return [IsCollectorOrAbove()]
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

    @action(detail=False, methods=['get'], url_path='auction-leaderboard', permission_classes=[AllowAny])
    def auction_leaderboard(self, request):
        """
        GET /api/donations/auction-leaderboard/?festival_id=1
        Returns sorted list of Velam Paata (auction) entries with donor info & payment status.
        """
        from rest_framework.decorators import action
        from rest_framework.permissions import AllowAny
        from rest_framework.response import Response

        festival_id = request.query_params.get('festival_id')
        association_param = request.query_params.get('association')

        if not festival_id:
            from festivals.models import Festival
            qs = Festival.objects.all()
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                qs = qs.filter(association_name__iexact=request.user.association_name.strip())
            elif association_param:
                qs = qs.filter(association_name__iexact=association_param.strip())

            active_fest = qs.filter(is_active=True).first() or qs.first()
            if not active_fest:
                return Response([])
            festival_id = active_fest.id
        else:
            # If festival_id is specified and user is authenticated, ensure festival belongs to user association
            from festivals.models import Festival
            fest = Festival.objects.filter(id=festival_id).first()
            if not fest:
                return Response([])
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                if fest.association_name.strip().lower() != request.user.association_name.strip().lower():
                    return Response([])

        auctions = (
            Donation.objects
            .filter(festival_id=festival_id, donation_type='VELAM_PAATA')
            .exclude(status='CANCELLED')
            .select_related('donor', 'receipt')
            .order_by('-amount')
        )

        results = []
        for a in auctions:
            donor_name = a.donor.name if a.donor else (a.notes or 'Devotee')
            receipt_no = f'#{a.id}'
            try:
                if hasattr(a, 'receipt') and a.receipt:
                    receipt_no = a.receipt.receipt_number
            except Exception:
                pass

            results.append({
                'id': a.id,
                'donor_name': donor_name,
                'donor_mobile': a.donor.mobile_number if a.donor else '',
                'donor_address': a.donor.address if a.donor else '',
                'auction_item': a.auction_item or 'మహా లడ్డు (Maha Laddu)',
                'amount': str(a.amount or 0),
                'payment_method': a.get_payment_method_display() if hasattr(a, 'get_payment_method_display') else str(a.payment_method),
                'donation_date': str(a.donation_date) if a.donation_date else '',
                'receipt_number': receipt_no,
                'notes': a.notes or '',
            })

        return Response(results)

