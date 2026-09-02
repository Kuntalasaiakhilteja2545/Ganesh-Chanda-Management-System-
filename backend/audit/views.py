from rest_framework.viewsets import ReadOnlyModelViewSet
from accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(ReadOnlyModelViewSet):
    """
    Read-only audit logs — admin only.
    GET /api/audit-logs/
    """
    queryset = AuditLog.objects.select_related('user').all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['model_name', 'action', 'user']
    search_fields = ['model_name', 'action', 'user__full_name', 'user__username', 'ip_address']
