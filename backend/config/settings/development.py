"""
Development Settings

WHAT: Settings specific to local development.
WHY:  We want DEBUG=True, verbose errors, and browser-based DRF views during development.
HOW:  Imports everything from base.py, then overrides/adds dev-specific settings.

USAGE: Set DJANGO_SETTINGS_MODULE=config.settings.development in .env
"""

from .base import *  # noqa: F401,F403 — import everything from base

# =============================================================================
# DEBUG
# =============================================================================
# DEBUG=True gives us:
# 1. Detailed error pages with stack traces
# 2. Django Debug Toolbar support
# 3. Static file serving without collectstatic
# NEVER use DEBUG=True in production — it exposes secrets!
DEBUG = True

ALLOWED_HOSTS = ['*']

# =============================================================================
# DEVELOPMENT-ONLY APPS
# =============================================================================
# Add BrowsableAPI renderer so we can test APIs in the browser during development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',  # Nice HTML forms in browser
)

# =============================================================================
# CORS — Allow all in development for easier testing
# =============================================================================
# In development, we might test from different ports.
# CORS_ALLOW_ALL_ORIGINS = True is acceptable ONLY in development.
CORS_ALLOW_ALL_ORIGINS = True

# =============================================================================
# LOGGING — More verbose in development
# =============================================================================
LOGGING['loggers']['django.db.backends'] = {  # noqa: F405
    'handlers': ['console'],
    'level': 'WARNING',  # Set to 'DEBUG' to see all SQL queries
    'propagate': False,
}

# =============================================================================
# EMAIL — Print to console instead of sending real emails
# =============================================================================
MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}
