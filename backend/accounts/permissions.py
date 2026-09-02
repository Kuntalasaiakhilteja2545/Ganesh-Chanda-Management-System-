"""
Permission Classes

WHAT: Permission classes control WHO can access WHICH endpoints.
      They run AFTER authentication (we know WHO the user is)
      but BEFORE the view logic (should they be ALLOWED to do this?).

WHY BACKEND PERMISSIONS MATTER:
    WRONG approach: Hide the "Delete" button in React for non-admins.
    → Anyone can call DELETE /api/donations/1/ with curl or Postman!
    
    RIGHT approach: Backend permission class rejects the request with 403 Forbidden.
    → No matter what the client sends, unauthorized actions are blocked.

HOW IT WORKS:
    1. Request arrives with JWT token
    2. JWTAuthentication decodes the token → identifies the user
    3. Permission class checks: does this user's ROLE allow this ACTION?
    4. If NO → return 403 Forbidden (request never reaches the view logic)
    5. If YES → proceed to the view

WHERE USED:
    class DonationViewSet(ModelViewSet):
        permission_classes = [IsCollectorOrAbove]  # Any logged-in committee member
    
    class ExpenseViewSet(ModelViewSet):
        permission_classes = [IsTreasurerOrAbove]  # Only treasurer and admin

REAL-WORLD EXAMPLE:
    Akhil (COLLECTOR) tries to DELETE an expense:
    → IsAdmin permission check → Akhil is COLLECTOR, not ADMIN
    → 403 Forbidden: "You do not have permission to perform this action."

COMMON MISTAKE:
    Using IsAuthenticated everywhere and checking role inside the view.
    This leads to scattered permission logic. Use dedicated permission classes.
"""

from rest_framework.permissions import BasePermission

from common.constants import Roles


class IsAdmin(BasePermission):
    """
    Only users with ADMIN role can access.
    
    Used for: User management, settings, audit logs, festival CRUD, 
              deleting financial records.
    """
    message = 'Only administrators can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Roles.ADMIN
        )


class IsTreasurerOrAbove(BasePermission):
    """
    ADMIN or TREASURER can access.
    
    Used for: Expense management, reports, exports, planning.
    
    WHY "OrAbove": Admin has ALL permissions that Treasurer has, plus more.
    This follows the hierarchy: ADMIN > TREASURER > COLLECTOR
    """
    message = 'Only administrators and treasurers can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (Roles.ADMIN, Roles.TREASURER)
        )


class IsCollectorOrAbove(BasePermission):
    """
    ADMIN, TREASURER, or COLLECTOR can access.
    
    This is essentially "any authenticated committee member".
    
    Used for: Adding donors, adding donations, generating receipts,
              viewing dashboard.
    """
    message = 'You must be a committee member to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (Roles.ADMIN, Roles.TREASURER, Roles.COLLECTOR)
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Admin can do anything. Others can only READ (GET, HEAD, OPTIONS).
    
    Used for: Expense categories (anyone can view the list,
              only admin can add/edit categories).
    
    SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS') — these don't modify data.
    """
    message = 'Only administrators can modify this resource.'

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Roles.ADMIN
        )
