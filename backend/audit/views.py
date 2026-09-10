from rest_framework.viewsets import ReadOnlyModelViewSet
from accounts.permissions import IsCollectorOrAbove
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(ReadOnlyModelViewSet):
    """
    Read-only audit logs — accessible to committee members.
    GET /api/audit-logs/
    """
    queryset = AuditLog.objects.select_related('user').all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsCollectorOrAbove]
    filterset_fields = ['model_name', 'action', 'user']
    search_fields = ['model_name', 'action', 'user__full_name', 'user__username', 'ip_address']
