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

# ALLOWED_HOSTS: Domain names allowed to serve the app.
ALLOWED_HOSTS = config(  # noqa: F405
    'ALLOWED_HOSTS',
    default='*',
    cast=Csv()  # noqa: F405
)

# =============================================================================
# HTTPS SECURITY HEADERS & PROXY SETTINGS
# =============================================================================
# Trust the X-Forwarded-Proto header set by Render / Railway / Cloudflare load balancers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True        # X-XSS-Protection header
SECURE_CONTENT_TYPE_NOSNIFF = True       # Prevent MIME type sniffing
SESSION_COOKIE_SECURE = True             # Cookies only over HTTPS
CSRF_COOKIE_SECURE = True               # CSRF cookie only over HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_HSTS_SECONDS = 31536000          # HSTS for 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =============================================================================
# STATIC FILES
# =============================================================================
STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405

# =============================================================================
# LOGGING — Log to file in production safely
# =============================================================================
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(parents=True, exist_ok=True)

LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.FileHandler',
    'filename': LOGS_DIR / 'django.log',
    'formatter': 'verbose',
}
LOGGING['root']['handlers'] = ['console', 'file']  # noqa: F405
