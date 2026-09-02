"""
Production Settings

WHAT: Settings for the live/deployed application.
WHY:  Security is critical — no debug pages, strict CORS, HTTPS enforcement.
HOW:  Imports base, then hardens everything.

USAGE: Set DJANGO_SETTINGS_MODULE=config.settings.production in .env
"""

from .base import *  # noqa: F401,F403

# =============================================================================
# SECURITY
# =============================================================================
DEBUG = False

# ALLOWED_HOSTS: Only your actual domain names.
# Without this, Django rejects all requests in production.
ALLOWED_HOSTS = config(  # noqa: F405
    'ALLOWED_HOSTS',
    default='localhost',
    cast=Csv()  # noqa: F405
)

# =============================================================================
# HTTPS SECURITY HEADERS
# =============================================================================
# These headers protect against common web attacks.
SECURE_BROWSER_XSS_FILTER = True        # X-XSS-Protection header
SECURE_CONTENT_TYPE_NOSNIFF = True       # Prevent MIME type sniffing
SESSION_COOKIE_SECURE = True             # Cookies only over HTTPS
CSRF_COOKIE_SECURE = True               # CSRF cookie only over HTTPS
SECURE_SSL_REDIRECT = True              # Redirect HTTP → HTTPS
SECURE_HSTS_SECONDS = 31536000          # HSTS for 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =============================================================================
# STATIC FILES
# =============================================================================
# In production, Django doesn't serve static files.
# Use Nginx or WhiteNoise instead.
STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405

# =============================================================================
# LOGGING — Log to file in production
# =============================================================================
LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.FileHandler',
    'filename': BASE_DIR / 'logs' / 'django.log',  # noqa: F405
    'formatter': 'verbose',
}
LOGGING['root']['handlers'] = ['console', 'file']  # noqa: F405
