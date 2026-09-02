import threading

# Thread-local storage — each request gets its own copy
_audit_context = threading.local()


def set_audit_user(user):
    """Set the authenticated user for the current thread."""
    if user and user.is_authenticated:
        _audit_context.user = user


def get_audit_context():
    """
    Get the current request's audit context (IP, User-Agent, and User).
    """
    return {
        'ip_address': getattr(_audit_context, 'ip_address', None),
        'user_agent': getattr(_audit_context, 'user_agent', ''),
        'user': getattr(_audit_context, 'user', None),
    }


class AuditMiddleware:
    """
    Django middleware that captures request metadata for audit logging.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            _audit_context.ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            _audit_context.ip_address = request.META.get('REMOTE_ADDR', None)
        
        _audit_context.user_agent = request.META.get('HTTP_USER_AGENT', '')
        _audit_context.request = request
        
        # In case user is already populated on request
        if hasattr(request, 'user') and request.user.is_authenticated:
            _audit_context.user = request.user
        else:
            _audit_context.user = None

        response = self.get_response(request)

        # Clean up thread-local after response
        _audit_context.ip_address = None
        _audit_context.user_agent = ''
        _audit_context.user = None
        _audit_context.request = None

        return response
