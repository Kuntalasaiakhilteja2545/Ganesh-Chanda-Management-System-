"""
Standard Pagination

WHAT: Controls how list API responses are paginated.
WHY:  Without pagination, GET /api/donations/ could return 10,000 rows,
      making the response slow and the frontend crash.
WHERE: Referenced in base.py → REST_FRAMEWORK → DEFAULT_PAGINATION_CLASS

HOW IT WORKS:
    Request:  GET /api/donations/?page=2&page_size=10
    Response: {
        "count": 156,          ← Total records in database
        "next": "/api/donations/?page=3&page_size=10",
        "previous": "/api/donations/?page=1&page_size=10",
        "results": [...]       ← Only 10 records
    }

COMMON MISTAKE:
    Setting page_size too large (e.g., 1000) defeats the purpose.
    Setting it too small (e.g., 5) causes too many API calls.
    20 is a good default for table-based UIs.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Default pagination for all list endpoints.
    
    page_size: Default number of items per page (20).
    page_size_query_param: Allows the client to request a different size.
    max_page_size: Prevents abuse — client can't request page_size=10000.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
