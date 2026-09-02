"""
Base Django Settings — Shared between development and production.

WHAT: This file contains all settings that are COMMON to every environment.
WHY:  Avoids duplicating config. Development and production only override what differs.
HOW:  development.py and production.py both start with `from .base import *`
"""

from pathlib import Path
from datetime import timedelta

from decouple import config, Csv

# =============================================================================
# PATH CONFIGURATION
# =============================================================================
# BASE_DIR points to the 'backend/' folder (parent of 'config/')
# This is used everywhere Django needs to find files on disk.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# =============================================================================
# SECURITY
# =============================================================================
# SECRET_KEY: Used for cryptographic signing (sessions, tokens, CSRF).
# MUST be unique and secret in production. We read it from .env so it's
# never in source code.
SECRET_KEY = config('SECRET_KEY')

# =============================================================================
# APPLICATION DEFINITION
# =============================================================================
# Django apps are loaded in this order. Our custom apps go after Django's
# built-in apps and third-party apps.

DJANGO_APPS = [
    'django.contrib.admin',        # Admin panel
    'django.contrib.auth',         # Authentication framework
    'django.contrib.contenttypes', # Content type system (for permissions)
    'django.contrib.sessions',     # Session management
    'django.contrib.messages',     # Flash messages
    'django.contrib.staticfiles',  # Serves static files in development
]

THIRD_PARTY_APPS = [
    'rest_framework',              # Django REST Framework — our API toolkit
    'rest_framework_simplejwt',    # JWT authentication
    'rest_framework_simplejwt.token_blacklist',  # Token blacklisting for logout
    'corsheaders',                 # CORS — lets React call our API
    'django_filters',              # Filtering for DRF querysets
    'drf_spectacular',             # OpenAPI/Swagger documentation
]

# Our custom apps — each handles one domain of the application
LOCAL_APPS = [
    'accounts',                    # Users, authentication, roles
    'festivals',                   # Festival/year management
    'donors',                      # Donor management
    'donations',                   # Donation management
    'expenses',                    # Expense management
    'receipts',                    # Receipt generation
    'reports',                     # Dashboard, reports, exports
    'planning',                    # Budget/planned expenses
    'audit',                       # Audit logging
    'common',                      # Shared utilities
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =============================================================================
# MIDDLEWARE
# =============================================================================
# Middleware runs on EVERY request/response. Order matters!
# CorsMiddleware MUST be before CommonMiddleware.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',       # Serves static files in production
    'corsheaders.middleware.CorsMiddleware',          # CORS — must be early
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit.middleware.AuditMiddleware',               # Captures IP/User-Agent
]

# =============================================================================
# URL CONFIGURATION
# =============================================================================
ROOT_URLCONF = 'config.urls'

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# =============================================================================
# DATABASE
# =============================================================================
# We use PostgreSQL because:
# 1. ACID compliance — critical for financial data
# 2. Robust transaction support
# 3. JSON fields for audit log data
# 4. Excellent Django support
#
# All values come from .env — never hard-coded.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='ganesh_chanda_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# =============================================================================
# CUSTOM USER MODEL
# =============================================================================
# Django allows replacing the default User model with a custom one.
# We MUST declare this BEFORE running the first migration.
# Our custom User adds: role, mobile_number, full_name
AUTH_USER_MODEL = 'accounts.User'

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================
# We support English and Telugu.
# TIME_ZONE is set to Asia/Kolkata because the application is used in India.
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True       # Enable translation system
USE_TZ = True         # Store datetimes in UTC, display in TIME_ZONE

# =============================================================================
# STATIC & MEDIA FILES
# =============================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# =============================================================================
# DEFAULT PRIMARY KEY TYPE
# =============================================================================
# Django 3.2+ defaults to BigAutoField. Explicit is better than implicit.
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================
# This is the CENTRAL configuration for DRF.
#
# DEFAULT_AUTHENTICATION_CLASSES:
#   JWT only — no session auth for the API. React/React Native send
#   "Authorization: Bearer <token>" with every request.
#
# DEFAULT_PERMISSION_CLASSES:
#   IsAuthenticated by default — every endpoint requires login unless
#   we explicitly set permission_classes = [AllowAny] on a view.
#
# DEFAULT_PAGINATION_CLASS:
#   All list endpoints return paginated results (not 10,000 rows at once).
#
# DEFAULT_FILTER_BACKENDS:
#   django-filter and search/ordering are available on all views.
#
# DEFAULT_SCHEMA_CLASS:
#   drf-spectacular generates OpenAPI/Swagger docs automatically.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'common.exceptions.custom_exception_handler',
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
    'DATE_FORMAT': '%Y-%m-%d',
}

# =============================================================================
# SIMPLE JWT CONFIGURATION
# =============================================================================
# ACCESS_TOKEN_LIFETIME: How long an access token is valid (default 60 min).
#   After it expires, the client must use the refresh token to get a new one.
#
# REFRESH_TOKEN_LIFETIME: How long a refresh token is valid (default 1 day).
#   After it expires, the user must log in again.
#
# ROTATE_REFRESH_TOKENS: When refreshing, issue a NEW refresh token too.
#   This prevents token reuse attacks.
#
# BLACKLIST_AFTER_ROTATION: Old refresh tokens are blacklisted.
#   Prevents an attacker from reusing a stolen old refresh token.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('ACCESS_TOKEN_LIFETIME', default=60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        minutes=config('REFRESH_TOKEN_LIFETIME', default=1440, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
# CORS (Cross-Origin Resource Sharing) controls which domains can call our API.
# Without this, React (localhost:5173) cannot call Django (localhost:8000)
# because browsers block cross-origin requests by default.
# SECURITY: Default to False in production; override to True in development.py
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://localhost:3000',
    cast=Csv()
)

STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# DRF-SPECTACULAR (API DOCUMENTATION)
# =============================================================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Ganesh Chanda Management System API',
    'DESCRIPTION': 'REST API for managing Ganesh Youth donations and expenses',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# =============================================================================
# LOGGING
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
