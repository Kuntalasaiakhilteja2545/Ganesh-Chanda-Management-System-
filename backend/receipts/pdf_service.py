"""
PDF Receipt Generation using ReportLab.
"""

import io
import os
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from common.utils import format_currency, amount_to_words_en


# Register Telugu font (Noto Sans Devanagari) for Telugu text rendering
FONT_DIR = os.path.join(os.path.dirname(__file__), 'fonts')
TELUGU_FONT_PATH = os.path.join(FONT_DIR, 'NotoSansDevanagari-Regular.ttf')

if os.path.exists(TELUGU_FONT_PATH):
    pdfmetrics.registerFont(TTFont('NotoSansDevanagari', TELUGU_FONT_PATH))
    TELUGU_FONT_AVAILABLE = True
else:
    TELUGU_FONT_AVAILABLE = False


def _contains_telugu(text):
    """Check if text contains Telugu characters (Unicode range: U+0C00–U+0C7F)."""
    if not text:
        return False
    return any('ఀ' <= char <= '౿' for char in text)


def generate_receipt_pdf(donation):
    """
    Generate a formatted A5 PDF donation receipt for a donation.
    Returns a BytesIO buffer.
    """
    buffer = io.BytesIO()
    receipt = donation.receipt
    donor = donation.donor
    festival = donation.festival

    width, height = A5
    c = canvas.Canvas(buffer, pagesize=A5)
    c.setTitle(f"Receipt {receipt.receipt_number}")

    # Primary Theme Colors
    primary = colors.HexColor('#c2410c')   # Deep saffron / orange
    secondary = colors.HexColor('#78350f') # Warm maroon
    gold = colors.HexColor('#d97706')      # Gold accent
    bg_light = colors.HexColor('#fffbeb')  # Warm light yellow/cream

    # Outer decorative border
    c.setStrokeColor(gold)
    c.setLineWidth(2.5)
    c.rect(8*mm, 8*mm, width - 16*mm, height - 16*mm)

    # Inner thin border
    c.setStrokeColor(secondary)
    c.setLineWidth(0.8)
    c.rect(10.5*mm, 10.5*mm, width - 21*mm, height - 21*mm)

    y = height - 18*mm

    # Divine Invocation
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(primary)
    c.drawCentredString(width/2, y, "||  OM SHRI GANESHAYA NAMAHA  ||")
    y -= 6*mm

    # Youth Association Name Header
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(secondary)
    assoc_name = festival.association_name or "Ganesh Youth Association"
    c.drawCentredString(width/2, y, assoc_name.upper())
    y -= 5*mm

    # Festival Title
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(primary)
    c.drawCentredString(width/2, y, f"{festival.name} - Navaratri Mahotsavam")
    y -= 4.5*mm

    # Pandal Location & Landmark
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor('#475569'))
    loc_text = festival.location or "Pandal Stage"
    if festival.landmark:
        loc_text += f" ({festival.landmark})"
    c.drawCentredString(width/2, y, f"Pandal: {loc_text}")
    y -= 3*mm

    # Decorative Line
    c.setStrokeColor(gold)
    c.setLineWidth(1)
    c.line(16*mm, y, width - 16*mm, y)
    y -= 5.5*mm

    # RECEIPT TITLE BADGE
    c.setFillColor(primary)
    c.roundRect((width/2) - 30*mm, y - 2*mm, 60*mm, 7*mm, 3*mm, fill=True, stroke=False)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.white)
    c.drawCentredString(width/2, y, "DONATION RECEIPT")
    y -= 8*mm

    # Receipt Meta Row (Receipt # & Date)
    left = 16*mm
    right_val = width - 16*mm

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor('#1e293b'))
    c.drawString(left, y, f"Receipt No: {receipt.receipt_number}")
    c.drawRightString(right_val, y, f"Date: {donation.donation_date.strftime('%d-%b-%Y')}")
    y -= 4*mm

    # Divider
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.5)
    c.line(left, y, right_val, y)
    y -= 6*mm

    # Donor info
    def draw_detail(label, val, y_pos, is_bold=False):
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor('#64748b'))
        c.drawString(left, y_pos, label)

        # Use Telugu font if value contains Telugu characters
        val_str = str(val)
        if TELUGU_FONT_AVAILABLE and _contains_telugu(val_str):
            font_name = "NotoSansDevanagari"
        else:
            font_name = "Helvetica-Bold" if is_bold else "Helvetica"

        c.setFont(font_name, 10)
        c.setFillColor(colors.HexColor('#0f172a'))
        c.drawRightString(right_val, y_pos, val_str)
        return y_pos - 5.5*mm

    y = draw_detail("Received From (Devotee):", donor.name, y, is_bold=True)
    if donor.address:
        y = draw_detail("Devotee Location / Colony:", donor.address, y)
    if donor.mobile_number:
        y = draw_detail("Contact Mobile:", donor.mobile_number, y)

    y -= 2*mm

    # Big Amount Box
    c.setFillColor(bg_light)
    c.setStrokeColor(gold)
    c.setLineWidth(1)
    c.roundRect(left, y - 10*mm, right_val - left, 14*mm, 3*mm, fill=True, stroke=True)

    c.setFillColor(secondary)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(left + 4*mm, y - 4*mm, f"Amount: {format_currency(donation.amount)}")
    y -= 14*mm

    # Amount in Words
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.HexColor('#334155'))
    words = amount_to_words_en(donation.amount)
    c.drawString(left, y, f"In Words: {words}")
    y -= 6*mm

    # Payment details
    y = draw_detail("Payment Method:", donation.get_payment_method_display(), y)
    if donation.transaction_id:
        y = draw_detail("Txn / UTR Reference:", donation.transaction_id, y)

    # Signatures & Blessing Footer
    y -= 5*mm
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.line(left, y, right_val, y)
    y -= 7*mm

    # Signature columns
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor('#475569'))
    c.drawString(left, y, "_______________________")
    c.drawRightString(right_val, y, "_______________________")
    y -= 4*mm

    collector_name = donation.collected_by.full_name or donation.collected_by.username if donation.collected_by else "Committee"
    c.drawString(left, y, f"Received By ({collector_name})")
    c.drawRightString(right_val, y, "Authorized Signatory (Youth Committee)")
    y -= 6*mm

    # Blessing Mantra
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(primary)
    c.drawCentredString(width/2, y, "🙏 GANPATI BAPPA MORYA! MAY LORD GANESHA BLESS YOU & YOUR FAMILY! 🙏")

    c.save()
    buffer.seek(0)
    return buffer


def generate_audit_statement_pdf(festival_id):
    """
    Generate an official 1-page A4 Financial Audit Statement & Balance Sheet PDF.
    """
    import datetime
    from reportlab.lib.pagesizes import A4
    from decimal import Decimal
    from django.db.models import Sum, Count
    from donations.models import Donation
    from expenses.models import Expense
    from festivals.models import Festival

    buffer = io.BytesIO()
    try:
        festival = Festival.objects.get(id=festival_id)
    except Festival.DoesNotExist:
        festival = Festival.objects.filter(is_active=True).first()

    width, height = A4
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle(f"Audit Statement - {festival.name if festival else 'Festival'}")

    primary = colors.HexColor('#701a1e')   # Deep royal maroon
    gold = colors.HexColor('#d97706')      # Warm gold
    slate = colors.HexColor('#0f172a')     # Dark slate
    bg_box = colors.HexColor('#fefce8')    # Light gold tint
    green = colors.HexColor('#15803d')     # Forest green

    # Double Border
    c.setStrokeColor(primary)
    c.setLineWidth(2)
    c.rect(10*mm, 10*mm, width - 20*mm, height - 20*mm)
    c.setStrokeColor(gold)
    c.setLineWidth(0.8)
    c.rect(12*mm, 12*mm, width - 24*mm, height - 24*mm)

    y = height - 20*mm
    left = 18*mm
    right = width - 18*mm

    # Invocations & Header
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(gold)
    c.drawCentredString(width/2, y, "||  OM SHRI GANESHAYA NAMAHA  ||")
    y -= 6*mm

    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(primary)
    assoc_name = festival.association_name if festival else "Jai Hind Ganesh Youth Association"
    c.drawCentredString(width/2, y, assoc_name.upper())
    y -= 5*mm

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(slate)
    c.drawCentredString(width/2, y, "ANNUAL FESTIVAL FINANCIAL AUDIT STATEMENT & BALANCE SHEET")
    y -= 4.5*mm

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor('#475569'))
    fest_info = f"Festival: {festival.name} ({festival.year})  •  Pandal: {festival.location or 'Main Stage'}" if festival else "Festival Season"
    c.drawCentredString(width/2, y, fest_info)
    y -= 4*mm

    c.setStrokeColor(gold)
    c.setLineWidth(1)
    c.line(left, y, right, y)
    y -= 6*mm

    # Aggregations
    donations_qs = Donation.objects.filter(festival_id=festival.id if festival else 1, status='CONFIRMED')
    total_donations = donations_qs.aggregate(t=Sum('amount', default=Decimal('0')))['t']
    donor_count = donations_qs.values('donor').distinct().count()
    donation_count = donations_qs.count()

    expenses_qs = Expense.objects.filter(festival_id=festival.id if festival else 1)
    total_expenses = expenses_qs.aggregate(t=Sum('amount', default=Decimal('0')))['t']
    expense_count = expenses_qs.count()
    net_balance = total_donations - total_expenses

    # Section 1: INCOME & COLLECTIONS
    c.setFillColor(primary)
    c.rect(left, y - 1*mm, right - left, 6*mm, fill=True, stroke=False)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.white)
    c.drawString(left + 3*mm, y + 0.5*mm, "1. INCOME & DEVOTEE CHANDA COLLECTIONS")
    y -= 7*mm

    # Income rows
    payment_breakdown = list(
        donations_qs.values('payment_method')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(slate)
    c.drawString(left + 3*mm, y, "Payment Method / Source")
    c.drawString(left + 80*mm, y, "Transactions")
    c.drawRightString(right - 3*mm, y, "Amount (INR)")
    y -= 4*mm
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.line(left + 3*mm, y, right - 3*mm, y)
    y -= 4*mm

    c.setFont("Helvetica", 8.5)
    for p in payment_breakdown:
        method_name = dict(Donation._meta.get_field('payment_method').choices).get(p['payment_method'], p['payment_method'])
        c.drawString(left + 3*mm, y, str(method_name))
        c.drawString(left + 80*mm, y, f"{p['count']} receipts")
        c.drawRightString(right - 3*mm, y, format_currency(p['total']))
        y -= 4.5*mm

    y -= 1*mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(primary)
    c.drawString(left + 3*mm, y, f"TOTAL COLLECTIONS ({donor_count} Devotees, {donation_count} Receipts):")
    c.drawRightString(right - 3*mm, y, format_currency(total_donations))
    y -= 7*mm

    # Section 2: EXPENDITURE BREAKDOWN
    c.setFillColor(primary)
    c.rect(left, y - 1*mm, right - left, 6*mm, fill=True, stroke=False)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.white)
    c.drawString(left + 3*mm, y + 0.5*mm, "2. FESTIVAL & PANDAL EXPENDITURE BREAKDOWN")
    y -= 7*mm

    category_breakdown = list(
        expenses_qs.values('category__name')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(slate)
    c.drawString(left + 3*mm, y, "Expense Category / Item")
    c.drawString(left + 80*mm, y, "Bills / Vouchers")
    c.drawRightString(right - 3*mm, y, "Amount (INR)")
    y -= 4*mm
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.line(left + 3*mm, y, right - 3*mm, y)
    y -= 4*mm

    c.setFont("Helvetica", 8.5)
    for cat in category_breakdown:
        c.drawString(left + 3*mm, y, str(cat['category__name'] or 'General Expenses'))
        c.drawString(left + 80*mm, y, f"{cat['count']} items")
        c.drawRightString(right - 3*mm, y, format_currency(cat['total']))
        y -= 4.5*mm

    y -= 1*mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(primary)
    c.drawString(left + 3*mm, y, f"TOTAL EXPENDITURE ({expense_count} Expenses):")
    c.drawRightString(right - 3*mm, y, format_currency(total_expenses))
    y -= 9*mm

    # Section 3: FINAL AUDITED TREASURY BALANCE BOX
    c.setFillColor(bg_box)
    c.setStrokeColor(gold)
    c.setLineWidth(1.2)
    c.roundRect(left, y - 10*mm, right - left, 14*mm, 3*mm, fill=True, stroke=True)

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(slate)
    c.drawString(left + 4*mm, y - 3.5*mm, "NET CLOSING TREASURY BALANCE (SURPLUS):")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(green if net_balance >= 0 else colors.red)
    c.drawRightString(right - 4*mm, y - 3.5*mm, format_currency(net_balance))

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.HexColor('#475569'))
    c.drawString(left + 4*mm, y - 7.5*mm, f"Audited & Generated On: {datetime.date.today().strftime('%d-%b-%Y')} via Ganesh Chanda Management Portal")
    y -= 18*mm

    # Section 4: FORMAL COMMITTEE SIGNATURE BLOCKS
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(slate)
    c.drawString(left + 3*mm, y, "OFFICIAL VERIFICATION & COMMITTEE SIGNATORIES:")
    y -= 12*mm

    col1 = left + 10*mm
    col2 = width / 2
    col3 = right - 10*mm

    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor('#64748b'))
    c.drawCentredString(col1, y, "__________________________")
    c.drawCentredString(col2, y, "__________________________")
    c.drawCentredString(col3, y, "__________________________")
    y -= 4*mm

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(slate)
    c.drawCentredString(col1, y, "PRESIDENT (అధ్యక్షుడు)")
    c.drawCentredString(col2, y, "GENERAL SECRETARY (కార్యదర్శి)")
    c.drawCentredString(col3, y, "TREASURER (కోశాధికారి)")
    y -= 3.5*mm

    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor('#64748b'))
    c.drawCentredString(col1, y, assoc_name)
    c.drawCentredString(col2, y, assoc_name)
    c.drawCentredString(col3, y, assoc_name)
    y -= 8*mm

    # Sacred Footer
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(primary)
    c.drawCentredString(width/2, y, "🙏 JAI GANESH! AUDITED TRANSPARENT REPORT FOR DEVOTEES & COMMITTEE 🙏")

    c.save()
    buffer.seek(0)
    return buffer

