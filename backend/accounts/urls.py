"""
Account URLs

WHAT: Maps URL paths to auth views.

WHY MANUAL URLS HERE (not Router):
    Authentication endpoints (login, refresh, logout, me) are NOT model CRUD.
    They don't map to list/create/retrieve/update/delete.
    So we use explicit path() instead of a Router.

ENDPOINTS:
    POST /api/auth/login/            → Get JWT tokens (access + refresh)
    POST /api/auth/refresh/          → Refresh expired access token
    POST /api/auth/logout/           → Blacklist refresh token
    GET  /api/auth/me/               → Get current user profile
    GET  /api/auth/users/            → List users (admin only)
    POST /api/auth/users/            → Create user (admin only)
    POST /api/auth/register/         → Public self-registration
    POST /api/auth/forgot-username/  → Recover username via mobile number
    POST /api/auth/reset-password/   → Reset password via username + mobile
"""

from django.urls import path

from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    MeView,
    LogoutView,
    UserListCreateView,
    RegisterView,
    ForgotUsernameView,
    ResetPasswordView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('forgot-username/', ForgotUsernameView.as_view(), name='forgot-username'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]

