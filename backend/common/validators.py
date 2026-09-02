"""
Common Validators

WHAT: Reusable validation functions for financial fields.
WHY:  Donation amount > 0, expense amount > 0 — this rule applies in multiple places.
      Instead of writing the check in every serializer, define it once here.

WHERE: Used in model field definitions and serializers.

COMMON MISTAKE:
    Validating only in the serializer but not in the model.
    If someone creates data via Django admin or shell, the serializer is bypassed.
    Model-level validators run regardless of how data enters the system.
"""

from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
import re


# Model-level validator for positive amounts
# Usage in models.py:
#   amount = models.DecimalField(..., validators=[positive_amount_validator])
positive_amount_validator = MinValueValidator(
    Decimal('0.01'),
    message='Amount must be greater than zero.'
)


def validate_mobile_number(value):
    """
    Validate Indian mobile number format.
    
    Accepts:
        - 10 digits: 9876543210
        - With country code: +919876543210
        - With spaces: 987 654 3210
    
    WHY: Mobile numbers are used for donor lookup. Consistent format
         prevents duplicate donors with different number formats.
    """
    if not value:
        return  # Mobile is optional, so empty is fine
    
    # Remove spaces, dashes, and country code prefix
    cleaned = re.sub(r'[\s\-]', '', value)
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    
    if not cleaned.isdigit() or len(cleaned) != 10:
        raise ValidationError(
            'Enter a valid 10-digit mobile number.',
            code='invalid_mobile'
        )
