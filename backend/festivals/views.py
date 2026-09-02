from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from accounts.permissions import IsAdmin, IsTreasurerOrAbove
from .models import Festival, CommitteeMember
from .serializers import FestivalSerializer, CommitteeMemberSerializer


class FestivalViewSet(ModelViewSet):
    queryset = Festival.objects.prefetch_related('committee_members').all()
    serializer_class = FestivalSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]


class CommitteeMemberViewSet(ModelViewSet):
    """
    CRUD for Youth Committee Members (President, Secretary, Members, etc.)
    """
    queryset = CommitteeMember.objects.select_related('festival').all()
    serializer_class = CommitteeMemberSerializer
    filterset_fields = ['festival', 'designation', 'is_active']
    search_fields = ['name', 'name_telugu', 'mobile_number', 'custom_designation']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsTreasurerOrAbove()]
