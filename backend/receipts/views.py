"""
Receipt PDF and Export Services
"""
from django.urls import path
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status

from accounts.permissions import IsCollectorOrAbove, IsTreasurerOrAbove
from donations.models import Donation


class ReceiptPDFView(APIView):
    """
    GET /api/receipts/{donation_id}/pdf/
    
    Generates a PDF receipt for a donation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, donation_id):
        try:
            donation = (
                Donation.objects
                .select_related('donor', 'festival', 'collected_by', 'receipt')
                .get(id=donation_id)
            )
        except Donation.DoesNotExist:
            return Response({'message': 'Donation not found'}, status=404)

        if not hasattr(donation, 'receipt'):
            return Response({'message': 'No receipt for this donation'}, status=404)

        from .pdf_service import generate_receipt_pdf
        pdf_buffer = generate_receipt_pdf(donation)

        from django.http import HttpResponse
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{donation.receipt.receipt_number}.pdf"'
        return response


class DonationExcelView(APIView):
    """
    GET /api/exports/donations/?festival_id=1
    
    Export all donations as Excel file.
    """
    permission_classes = [IsCollectorOrAbove]

    def get(self, request):
        from .excel_service import generate_donations_excel
        festival_id = request.query_params.get('festival_id')

        if not festival_id:
            from festivals.models import Festival
            festival = Festival.objects.filter(is_active=True).first()
            if not festival:
                return Response({'message': 'No active festival'}, status=404)
            festival_id = festival.id

        donations = (
            Donation.objects
            .filter(festival_id=festival_id, status='CONFIRMED')
            .select_related('donor', 'collected_by', 'receipt')
            .order_by('donation_date', 'id')
        )

        buffer = generate_donations_excel(donations, festival_id)

        from django.http import HttpResponse
        response = HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="donations_{festival_id}.xlsx"'
        return response


class ExpenseExcelView(APIView):
    """
    GET /api/exports/expenses/?festival_id=1
    """
    permission_classes = [IsCollectorOrAbove]

    def get(self, request):
        from .excel_service import generate_expenses_excel
        from expenses.models import Expense
        festival_id = request.query_params.get('festival_id')

        if not festival_id:
            from festivals.models import Festival
            festival = Festival.objects.filter(is_active=True).first()
            if not festival:
                return Response({'message': 'No active festival'}, status=404)
            festival_id = festival.id

        expenses = (
            Expense.objects
            .filter(festival_id=festival_id)
            .select_related('category', 'paid_by')
            .order_by('expense_date', 'id')
        )

        buffer = generate_expenses_excel(expenses, festival_id)

        from django.http import HttpResponse
        response = HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="expenses_{festival_id}.xlsx"'
        return response
