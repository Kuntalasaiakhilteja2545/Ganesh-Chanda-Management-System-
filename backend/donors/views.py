"""
Donor ViewSet

SAME PATTERN as FestivalViewSet — one class, full CRUD.

SEARCH:
    DRF's SearchFilter (configured in base.py) lets us add search
    with just one attribute: search_fields.
    
    GET /api/donors/?search=Ravi
    → Searches name AND mobile_number
    → Returns matching donors

FILTERING:
    DRF's OrderingFilter lets clients sort results:
    GET /api/donors/?ordering=name
    GET /api/donors/?ordering=-created_at  (descending)
"""

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsCollectorOrAbove, IsTreasurerOrAbove
from .models import Donor
from .serializers import DonorSerializer


class DonorViewSet(ModelViewSet):
    """
    Donor CRUD with search support.
    
    GET    /api/donors/              → list (with search & pagination)
    POST   /api/donors/              → create
    GET    /api/donors/1/            → get donor #1
    PATCH  /api/donors/1/            → update
    DELETE /api/donors/1/            → soft delete
    
    Search: GET /api/donors/?search=Ravi
    """
    queryset = Donor.objects.all()  # ActiveManager auto-excludes deleted
    serializer_class = DonorSerializer
    search_fields = ['name', 'mobile_number']  # SearchFilter uses these
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        """
        Any committee member can add/view donors.
        Only treasurer+ can edit. Only admin can delete.
        """
        if self.action in ['list', 'retrieve', 'create']:
            return [IsCollectorOrAbove()]
        if self.action in ['update', 'partial_update']:
            return [IsTreasurerOrAbove()]
        # destroy
        from accounts.permissions import IsAdmin
        return [IsAdmin()]

    def perform_destroy(self, instance):
        """
        Override destroy to SOFT DELETE instead of hard delete.
        
        DEFAULT: ModelViewSet.perform_destroy() calls instance.delete()
                 which permanently removes the row from PostgreSQL.
        
        OVERRIDE: We call soft_delete() which sets is_deleted=True.
                  The donor record stays in the database for audit purposes.
        """
        instance.soft_delete()
