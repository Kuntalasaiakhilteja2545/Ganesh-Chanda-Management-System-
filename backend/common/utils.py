"""
Utility Functions

WHAT: Helper functions used across the application.
WHY:  Currency formatting, amount-to-words conversion — needed in receipts,
      reports, PDFs, and exports. Define once, use everywhere.
"""

from decimal import Decimal


def format_currency(amount):
    """
    Format amount in Indian currency style.
    
    Examples:
        format_currency(95500)    → '₹95,500.00'
        format_currency(1000.50)  → '₹1,000.50'
        format_currency(250)      → '₹250.00'
    
    Indian number system uses lakhs and crores, not millions:
        1,00,000 (one lakh) not 100,000
        1,00,00,000 (one crore) not 10,000,000
    
    For amounts under 1 lakh, standard formatting works.
    For larger amounts, we use Indian grouping.
    """
    amount = Decimal(str(amount))
    
    # Handle negative amounts
    sign = '-' if amount < 0 else ''
    amount = abs(amount)
    
    # Split into integer and decimal parts
    integer_part = int(amount)
    decimal_part = f"{amount % 1:.2f}"[2:]  # Get 2 decimal places
    
    # Indian number formatting
    if integer_part < 1000:
        formatted = str(integer_part)
    else:
        # Last 3 digits
        last_three = str(integer_part % 1000).zfill(3)
        remaining = integer_part // 1000
        
        # Group remaining digits in pairs (Indian system)
        groups = []
        while remaining > 0:
            groups.append(str(remaining % 100).zfill(2) if remaining >= 100 else str(remaining % 100))
            remaining //= 100
        
        groups.reverse()
        # Remove leading zeros from first group
        if groups:
            groups[0] = str(int(groups[0]))
        
        formatted = ','.join(groups) + ',' + last_three
    
    return f'{sign}₹{formatted}.{decimal_part}'


def amount_to_words_en(amount):
    """
    Convert amount to English words.

    Examples:
        amount_to_words_en(2000) → 'Two Thousand Rupees Only'
        amount_to_words_en(1500) → 'One Thousand Five Hundred Rupees Only'
        amount_to_words_en(100.50) → 'One Hundred Rupees and Fifty Paise Only'

    Used in receipts for added formality and fraud prevention.
    """
    amount = Decimal(str(amount))

    if amount == 0:
        return 'Zero Rupees Only'

    # Split into rupees and paise
    rupees = int(amount)
    paise = int((amount - rupees) * 100 + Decimal('0.5'))  # round to nearest paise

    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
            'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
            'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
            'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def _convert_chunk(n):
        """Convert a number less than 1000 to words."""
        if n == 0:
            return ''
        elif n < 20:
            return ones[n]
        elif n < 100:
            return tens[n // 10] + ('' if n % 10 == 0 else ' ' + ones[n % 10])
        else:
            return (ones[n // 100] + ' Hundred' +
                    ('' if n % 100 == 0 else ' and ' + _convert_chunk(n % 100)))

    # Indian number system: Crore, Lakh, Thousand, Hundred
    parts = []
    remaining_rupees = rupees

    if remaining_rupees >= 10000000:  # Crore
        parts.append(_convert_chunk(remaining_rupees // 10000000) + ' Crore')
        remaining_rupees %= 10000000

    if remaining_rupees >= 100000:  # Lakh
        parts.append(_convert_chunk(remaining_rupees // 100000) + ' Lakh')
        remaining_rupees %= 100000

    if remaining_rupees >= 1000:  # Thousand
        parts.append(_convert_chunk(remaining_rupees // 1000) + ' Thousand')
        remaining_rupees %= 1000

    if remaining_rupees > 0:
        parts.append(_convert_chunk(remaining_rupees))

    words = ' '.join(parts) + ' Rupees'

    if paise > 0:
        paise_words = _convert_chunk(paise)
        words += ' and ' + paise_words + ' Paise'

    return words + ' Only'
