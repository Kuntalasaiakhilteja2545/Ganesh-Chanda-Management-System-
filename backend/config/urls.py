"""
Root URL Configuration — DefaultRouter Approach

WHAT: Central URL routing for the entire application.

HOW IT WORKS (ViewSet + Router):
    Instead of writing URL patterns manually for each app, we:
    1. Create ONE DefaultRouter
    2. Register each ViewSet with ONE line
    3. DRF auto-generates all CRUD URLs

    For example, this ONE line:
        router.register('donors', DonorViewSet)
    
    Auto-generates SIX endpoints:
        GET    /api/donors/       → list all donors
        POST   /api/donors/       → create a donor
        GET    /api/donors/1/     → get donor #1
        PUT    /api/donors/1/     → full update donor #1
        PATCH  /api/donors/1/     → partial update donor #1
        DELETE /api/donors/1/     → delete donor #1

WHY DefaultRouter:
    - Less code (1 line vs 6+ lines per resource)
    - Consistent URL naming
    - Auto-generates an API root page (GET /api/ shows all endpoints)
    - Supports @action decorator for custom endpoints

WHAT STILL NEEDS MANUAL URLs:
    - Authentication (JWT login/refresh — not a model resource)
    - Reports (complex aggregation endpoints)
    - Public dashboard (different auth/serializer)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

# ViewSet imports
from festivals.views import FestivalViewSet, CommitteeMemberViewSet
from donors.views import DonorViewSet
from donations.views import DonationViewSet
from expenses.views import ExpenseViewSet, ExpenseCategoryViewSet
from planning.views import PlannedExpenseViewSet
from audit.views import AuditLogViewSet
from common.views import health_check, root_view

# =============================================================================
# DEFAULT ROUTER
# =============================================================================
router = DefaultRouter()

# Core data
router.register('festivals', FestivalViewSet, basename='festival')
router.register('committee-members', CommitteeMemberViewSet, basename='committee-member')
router.register('donors', DonorViewSet, basename='donor')
router.register('donations', DonationViewSet, basename='donation')

# Expenses
router.register('expenses', ExpenseViewSet, basename='expense')
router.register('expense-categories', ExpenseCategoryViewSet, basename='expense-category')

# Planning
router.register('planning', PlannedExpenseViewSet, basename='planned-expense')

# Audit (read-only)
router.register('audit-logs', AuditLogViewSet, basename='audit-log')


# =============================================================================
# URL PATTERNS
# =============================================================================
urlpatterns = [
    # Root Welcome Endpoint
    path('', root_view, name='root'),

    # Django Admin Panel
    path('admin/', admin.site.urls),

    # Health check (before router for simple access)
    path('api/health/', health_check, name='health-check'),

    # Router-generated URLs (all ViewSets under /api/)
    path('api/', include(router.urls)),

    # Authentication (manual — JWT is not a model resource)
    path('api/auth/', include('accounts.urls')),

    # Reports (manual — complex aggregation endpoints)
    path('api/', include('reports.urls')),

    # Receipts & Exports (PDF, Excel)
    path('api/', include('receipts.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
