"""
Custom Exception Handler

WHAT: Overrides DRF's default error response format to provide CONSISTENT error responses.

WHY:  By default, DRF returns errors in different formats:
      - Validation error: {"field": ["error message"]}
      - Auth error: {"detail": "Authentication credentials were not provided."}
      - 404 error: {"detail": "Not found."}
      
      This is confusing for the frontend. We want a CONSISTENT format:
      {
          "success": false,
          "message": "Human-readable summary",
          "errors": { ... }  ← field-level errors (if any)
      }

WHERE: Referenced in base.py → REST_FRAMEWORK → EXCEPTION_HANDLER

HOW IT CONNECTS:
    1. A view raises a validation error (e.g., amount < 0)
    2. DRF catches it and calls our custom_exception_handler
    3. We format it consistently
    4. React always knows to look for response.data.success and response.data.message

COMMON MISTAKE:
    Not handling non-DRF exceptions (e.g., database errors).
    The fallback at the end catches those and returns a generic 500 error
    without exposing internal stack traces.
"""

from rest_framework.views import exception_handler
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent JSON error responses.
    
    Args:
        exc: The exception that was raised
        context: Dict containing the view, request, and other context
    
    Returns:
        Response with consistent error format
    """
    # Let DRF handle the exception first (it handles most cases)
    response = exception_handler(exc, context)

    if response is not None:
        # DRF handled it — now reformat the response
        custom_data = {
            'success': False,
            'status_code': response.status_code,
        }

        # Extract a human-readable message
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                # Single error message (e.g., 401, 403, 404)
                custom_data['message'] = str(response.data['detail'])
                custom_data['errors'] = {}
            else:
                # Field-level validation errors
                custom_data['message'] = 'Validation failed. Please check the errors below.'
                custom_data['errors'] = response.data
        elif isinstance(response.data, list):
            # List of error messages
            custom_data['message'] = response.data[0] if response.data else 'An error occurred.'
            custom_data['errors'] = {}
        else:
            custom_data['message'] = str(response.data)
            custom_data['errors'] = {}

        response.data = custom_data

    # If response is None, DRF couldn't handle it (unexpected server error).
    # We DON'T format it here — Django's 500 handler will catch it.
    # In production, this returns a generic error. In development, it shows the traceback.

    return response
