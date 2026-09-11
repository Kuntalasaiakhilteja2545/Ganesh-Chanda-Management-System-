"""
Report Views — Dashboard, Daily/Monthly/Festival summaries, Public dashboard.

Uses @action-style endpoints but on a ViewSet without a model (ViewSet, not ModelViewSet).
"""

from decimal import Decimal
from datetime import date, timedelta

from django.db.models import Sum, Count, Q, F
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from accounts.permissions import IsTreasurerOrAbove
from donations.models import Donation
from expenses.models import Expense
from festivals.models import Festival
from common.constants import PaymentMethods


class DashboardView(APIView):
    """
    GET /api/dashboard/summary/?festival_id=1

    Returns totals, balance, today's summary, payment breakdown.
    All financial calculations done on the BACKEND using DB aggregation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        festival_id = request.query_params.get('festival_id')
        if not festival_id:
            qs = Festival.objects.all()
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                qs = qs.filter(association_name__iexact=request.user.association_name.strip())
            festival = qs.filter(is_active=True).first() or qs.first()
            if not festival:
                return Response({'message': 'No active festival found'}, status=404)
            festival_id = festival.id
        else:
            try:
                festival = Festival.objects.get(id=festival_id)
            except Festival.DoesNotExist:
                return Response({'message': 'Festival not found'}, status=404)

        today = date.today()

        # Core aggregations
        donations_agg = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED'
        ).aggregate(
            total=Sum('amount', default=Decimal('0')),
            count=Count('id'),
        )
        
        # Check if expenses exist for exact festival, else fallback to association
        from django.db.models import Q
        assoc_name = getattr(festival, 'association_name', '')
        expenses_qs = Expense.objects.filter(
            Q(festival_id=festival_id) | (Q(festival__association_name__iexact=assoc_name.strip()) if assoc_name else Q())
        )
        if not Expense.objects.filter(festival_id=festival_id).exists() and assoc_name:
            expenses_qs = Expense.objects.filter(festival__association_name__iexact=assoc_name.strip())
        else:
            expenses_qs = Expense.objects.filter(festival_id=festival_id)

        expenses_agg = expenses_qs.aggregate(
            total=Sum('amount', default=Decimal('0')),
            count=Count('id'),
        )

        # Today
        today_donations = Donation.objects.filter(
            festival_id=festival_id, donation_date=today, status='CONFIRMED'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))

        today_expenses = expenses_qs.filter(
            expense_date=today
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))

        # Payment method breakdown
        payment_breakdown = list(
            Donation.objects.filter(festival_id=festival_id, status='CONFIRMED')
            .values('payment_method')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        # Expense category breakdown
        category_breakdown = list(
            expenses_qs
            .values('category__name')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        velam_paata_agg = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED', donation_type='VELAM_PAATA'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))

        velam_paata_pending_agg = Donation.objects.filter(
            festival_id=festival_id, status='PENDING', donation_type='VELAM_PAATA'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))

        chanda_agg = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED', donation_type='CHANDA'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))

        annadhanam_agg = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED', donation_type='ANNADHANAM'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))
        annadhanam_total = annadhanam_agg['total']
        annadhanam_count = annadhanam_agg['count']
        meals_sponsored = int(annadhanam_total / Decimal('35')) if annadhanam_total > Decimal('0') else (annadhanam_count * 150)

        total_donations = donations_agg['total']
        total_expenses = expenses_agg['total']
        balance = total_donations - total_expenses

        return Response({
            'festival': {
                'id': festival.id,
                'name': festival.name,
                'name_telugu': festival.name_telugu,
                'year': festival.year,
            },
            'total_donations': str(total_donations),
            'total_expenses': str(total_expenses),
            'balance': str(balance),
            'donation_count': donations_agg['count'],
            'expense_count': expenses_agg['count'],
            'velam_paata_total': str(velam_paata_agg['total']),
            'velam_paata_count': velam_paata_agg['count'],
            'velam_paata_pending_total': str(velam_paata_pending_agg['total']),
            'velam_paata_pending_count': velam_paata_pending_agg['count'],
            'chanda_total': str(chanda_agg['total']),
            'chanda_count': chanda_agg['count'],
            'annadhanam_total': str(annadhanam_total),
            'annadhanam_count': annadhanam_count,
            'meals_sponsored': meals_sponsored,
            'today': {
                'donations': str(today_donations['total']),
                'donation_count': today_donations['count'],
                'expenses': str(today_expenses['total']),
                'expense_count': today_expenses['count'],
                'net': str(today_donations['total'] - today_expenses['total']),
            },
            'payment_breakdown': payment_breakdown,
            'category_breakdown': category_breakdown,
        })


class DailyReportView(APIView):
    """
    GET /api/reports/daily/?festival_id=1&date=2026-08-13

    Detailed daily report with individual donations and expenses.
    """
    permission_classes = [IsTreasurerOrAbove]

    def get(self, request):
        festival_id = request.query_params.get('festival_id')
        report_date = request.query_params.get('date', str(date.today()))

        if not festival_id:
            qs = Festival.objects.all()
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                qs = qs.filter(association_name__iexact=request.user.association_name.strip())
            festival = qs.filter(is_active=True).first() or qs.first()
            if not festival:
                return Response({'message': 'No active festival'}, status=404)
            festival_id = festival.id

        donations = list(
            Donation.objects.filter(
                festival_id=festival_id, donation_date=report_date, status='CONFIRMED'
            ).select_related('donor', 'collected_by')
            .values('id', 'donor__name', 'amount', 'payment_method',
                    'transaction_id', 'collected_by__full_name')
        )
        expenses = list(
            Expense.objects.filter(
                festival_id=festival_id, expense_date=report_date
            ).select_related('category', 'paid_by')
            .values('id', 'description', 'amount', 'category__name',
                    'payment_method', 'paid_by__full_name')
        )

        total_donations = sum(d['amount'] for d in donations)
        total_expenses = sum(e['amount'] for e in expenses)

        return Response({
            'date': report_date,
            'donations': donations,
            'expenses': expenses,
            'total_donations': str(total_donations),
            'total_expenses': str(total_expenses),
            'daily_net': str(total_donations - total_expenses),
        })


class MonthlyReportView(APIView):
    """
    GET /api/reports/monthly/?festival_id=1&month=2026-08

    Monthly aggregation by day.
    """
    permission_classes = [IsTreasurerOrAbove]

    def get(self, request):
        festival_id = request.query_params.get('festival_id')
        month = request.query_params.get('month', date.today().strftime('%Y-%m'))

        if not festival_id:
            qs = Festival.objects.all()
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                qs = qs.filter(association_name__iexact=request.user.association_name.strip())
            festival = qs.filter(is_active=True).first() or qs.first()
            if not festival:
                return Response({'message': 'No active festival'}, status=404)
            festival_id = festival.id

        year, month_num = int(month.split('-')[0]), int(month.split('-')[1])

        daily_donations = list(
            Donation.objects.filter(
                festival_id=festival_id, status='CONFIRMED',
                donation_date__year=year, donation_date__month=month_num
            ).annotate(day=TruncDate('donation_date'))
            .values('day')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('day')
        )
        daily_expenses = list(
            Expense.objects.filter(
                festival_id=festival_id,
                expense_date__year=year, expense_date__month=month_num
            ).annotate(day=TruncDate('expense_date'))
            .values('day')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('day')
        )

        total_d = Donation.objects.filter(
            festival_id=festival_id, status='CONFIRMED',
            donation_date__year=year, donation_date__month=month_num
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total']

        total_e = Expense.objects.filter(
            festival_id=festival_id,
            expense_date__year=year, expense_date__month=month_num
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total']

        return Response({
            'month': month,
            'daily_donations': daily_donations,
            'daily_expenses': daily_expenses,
            'total_donations': str(total_d),
            'total_expenses': str(total_e),
            'balance': str(total_d - total_e),
        })


class ComparisonReportView(APIView):
    """
    GET /api/reports/comparison/?year1=2025&year2=2026

    Category-wise comparison between two festival years.
    """
    permission_classes = [IsTreasurerOrAbove]

    def get(self, request):
        year1 = request.query_params.get('year1')
        year2 = request.query_params.get('year2')

        if not year1 or not year2:
            return Response({'message': 'year1 and year2 are required'}, status=400)

        try:
            f1 = Festival.objects.get(year=year1)
            f2 = Festival.objects.get(year=year2)
        except Festival.DoesNotExist:
            return Response({'message': 'One or both festivals not found'}, status=404)

        def get_category_totals(festival_id):
            return {
                item['category__name']: item['total']
                for item in Expense.objects.filter(festival_id=festival_id)
                .values('category__name')
                .annotate(total=Sum('amount'))
            }

        totals1 = get_category_totals(f1.id)
        totals2 = get_category_totals(f2.id)
        all_cats = sorted(set(list(totals1.keys()) + list(totals2.keys())))

        comparison = []
        for cat in all_cats:
            amt1 = totals1.get(cat, Decimal('0'))
            amt2 = totals2.get(cat, Decimal('0'))
            diff = amt2 - amt1
            pct = round((diff / amt1 * 100), 1) if amt1 > 0 else None
            comparison.append({
                'category': cat,
                f'year_{year1}': str(amt1),
                f'year_{year2}': str(amt2),
                'difference': str(diff),
                'percentage_change': pct,
            })

        # Overall totals
        d1 = Donation.objects.filter(festival=f1, status='CONFIRMED').aggregate(t=Sum('amount', default=Decimal('0')))['t']
        d2 = Donation.objects.filter(festival=f2, status='CONFIRMED').aggregate(t=Sum('amount', default=Decimal('0')))['t']
        e1 = Expense.objects.filter(festival=f1).aggregate(t=Sum('amount', default=Decimal('0')))['t']
        e2 = Expense.objects.filter(festival=f2).aggregate(t=Sum('amount', default=Decimal('0')))['t']

        return Response({
            'year1': int(year1), 'year2': int(year2),
            'comparison': comparison,
            'summary': {
                f'donations_{year1}': str(d1), f'donations_{year2}': str(d2),
                f'expenses_{year1}': str(e1), f'expenses_{year2}': str(e2),
                f'balance_{year1}': str(d1 - e1), f'balance_{year2}': str(d2 - e2),
            }
        })


class PublicDashboardView(APIView):
    """
    GET /api/public/dashboard/?festival_id=1

    Public read-only dashboard — NO authentication required.
    Exposes ONLY safe aggregate data, NO private info.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        festival_id = request.query_params.get('festival_id')
        association_param = request.query_params.get('association')

        qs = Festival.objects.all()
        if festival_id:
            qs = qs.filter(id=festival_id)
        elif association_param:
            qs = qs.filter(association_name__iexact=association_param.strip())

        festival = qs.filter(is_active=True).first() or qs.first()
        if not festival:
            return Response({'message': 'No active festival found'}, status=404)

        total_donations = Donation.objects.filter(
            festival=festival, status='CONFIRMED'
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total']

        total_expenses = Expense.objects.filter(
            festival=festival
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total']

        donor_count = Donation.objects.filter(
            festival=festival, status='CONFIRMED'
        ).values('donor').distinct().count()

        category_breakdown = list(
            Expense.objects.filter(festival=festival)
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        annadhanam_agg = Donation.objects.filter(
            festival=festival, status='CONFIRMED', donation_type='ANNADHANAM'
        ).aggregate(total=Sum('amount', default=Decimal('0')), count=Count('id'))
        annadhanam_total = annadhanam_agg['total']
        annadhanam_count = annadhanam_agg['count']
        meals_sponsored = int(annadhanam_total / Decimal('35')) if annadhanam_total > Decimal('0') else (annadhanam_count * 150)

        return Response({
            'festival': {
                'id': festival.id,
                'name': festival.name,
                'name_telugu': festival.name_telugu,
                'association_name': festival.association_name,
                'association_name_telugu': festival.association_name_telugu,
                'location': festival.location,
                'landmark': festival.landmark,
                'upi_id': festival.upi_id,
                'qr_code_image': festival.qr_code_image,
                'year': festival.year,
            },
            'total_donations': str(total_donations),
            'total_expenses': str(total_expenses),
            'balance': str(total_donations - total_expenses),
            'donor_count': donor_count,
            'category_breakdown': category_breakdown,
            'annadhanam': {
                'total_amount': str(annadhanam_total),
                'sponsor_count': annadhanam_count,
                'meals_sponsored': meals_sponsored,
            }
        })


class AuditStatementPdfView(APIView):
    """
    GET /api/reports/audit-statement-pdf/?festival_id=1
    Generates and returns an official 1-page A4 Financial Audit Statement PDF.
    """
    permission_classes = [IsTreasurerOrAbove]

    def get(self, request):
        from django.http import HttpResponse
        from receipts.pdf_service import generate_audit_statement_pdf

        if not festival_id:
            qs = Festival.objects.all()
            if request.user and request.user.is_authenticated and getattr(request.user, 'association_name', None):
                qs = qs.filter(association_name__iexact=request.user.association_name.strip())
            active_fest = qs.filter(is_active=True).first() or qs.first()
            if not active_fest:
                return Response({'message': 'No active festival found'}, status=404)
            festival_id = active_fest.id

        buffer = generate_audit_statement_pdf(festival_id)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Audit_Statement_Festival_{festival_id}.pdf"'
        return response

