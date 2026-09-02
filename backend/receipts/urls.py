from django.urls import path
from .views import ReceiptPDFView, DonationExcelView, ExpenseExcelView

urlpatterns = [
    path('receipts/<int:donation_id>/pdf/', ReceiptPDFView.as_view(), name='receipt-pdf'),
    path('exports/donations/', DonationExcelView.as_view(), name='export-donations'),
    path('exports/expenses/', ExpenseExcelView.as_view(), name='export-expenses'),
]
