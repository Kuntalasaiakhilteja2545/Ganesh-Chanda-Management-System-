from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from accounts.permissions import IsAdmin, IsCollectorOrAbove, IsTreasurerOrAbove
from .models import Festival, CommitteeMember
from .serializers import FestivalSerializer, CommitteeMemberSerializer


class FestivalViewSet(ModelViewSet):
    serializer_class = FestivalSerializer

    def get_queryset(self):
        qs = Festival.objects.prefetch_related('committee_members').all()
        if self.request.user and self.request.user.is_authenticated and getattr(self.request.user, 'association_name', None):
            qs = qs.filter(association_name__iexact=self.request.user.association_name.strip())
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'active']:
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update']:
            return [IsCollectorOrAbove()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        assoc_name = getattr(self.request.user, 'association_name', '') or 'Ganesh Youth Association'
        serializer.save(association_name=assoc_name)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """GET /api/festivals/active/ -> returns current active festival for association"""
        qs = Festival.objects.all()
        assoc = request.query_params.get('association') or (request.user.association_name if request.user and request.user.is_authenticated else None)
        if assoc:
            qs = qs.filter(association_name__iexact=assoc.strip())
        
        active_fest = qs.filter(is_active=True).first() or qs.first()
        if not active_fest:
            return Response({'message': 'No active festival found'}, status=404)
        return Response(FestivalSerializer(active_fest).data)


class CommitteeMemberViewSet(ModelViewSet):
    """
    CRUD for Youth Committee Members (President, Secretary, Members, etc.)
    """
    serializer_class = CommitteeMemberSerializer
    filterset_fields = ['festival', 'designation', 'is_active']
    search_fields = ['name', 'name_telugu', 'mobile_number', 'custom_designation']

    def get_queryset(self):
        qs = CommitteeMember.objects.select_related('festival').all()
        if self.request.user and self.request.user.is_authenticated and getattr(self.request.user, 'association_name', None):
            qs = qs.filter(festival__association_name__iexact=self.request.user.association_name.strip())
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsCollectorOrAbove()]
