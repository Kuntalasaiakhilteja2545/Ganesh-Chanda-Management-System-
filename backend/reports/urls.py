from django.urls import path
from .views import (
    DashboardView,
    DailyReportView,
    MonthlyReportView,
    ComparisonReportView,
    PublicDashboardView,
    AuditStatementPdfView,
)

urlpatterns = [
    path('dashboard/summary/', DashboardView.as_view(), name='dashboard-summary'),
    path('reports/daily/', DailyReportView.as_view(), name='report-daily'),
    path('reports/monthly/', MonthlyReportView.as_view(), name='report-monthly'),
    path('reports/comparison/', ComparisonReportView.as_view(), name='report-comparison'),
    path('reports/audit-statement-pdf/', AuditStatementPdfView.as_view(), name='report-audit-statement-pdf'),
    path('public/dashboard/', PublicDashboardView.as_view(), name='public-dashboard'),
]
