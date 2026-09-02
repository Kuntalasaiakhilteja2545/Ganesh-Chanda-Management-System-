"""
Account Views

WHAT: Views handle HTTP requests and return HTTP responses.
      They are the "controller" in MVC architecture.

DRF VIEW TYPES (from simplest to most powerful):
    1. @api_view          → Function-based (simplest, for one-off endpoints)
    2. APIView             → Class-based (manual control over GET/POST/etc.)
    3. GenericAPIView      → Adds queryset + serializer_class
    4. Mixins              → Adds list/create/retrieve/update/destroy
    5. GenericViewSets     → Adds routing support
    6. ModelViewSet        → ALL of the above combined (most powerful)

FOR AUTHENTICATION, we use:
    - SimpleJWT's built-in views for login/refresh (they handle token generation)
    - Custom APIView for /me/ and /logout/ (simple, non-CRUD endpoints)

WHY NOT ViewSet FOR AUTH:
    Login, logout, refresh are NOT model CRUD operations.
    They don't map to list/create/retrieve/update/delete.
    So plain APIView is the right choice here.

FLOW:
    POST /api/auth/login/
    → CustomTokenObtainPairView.post()
    → SimpleJWT validates credentials
    → Returns { access, refresh, user: { id, username, role, ... } }
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, UserCreateSerializer
from .permissions import IsAdmin


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends SimpleJWT's login serializer to include user info in the response.
    
    DEFAULT SimpleJWT response:
        { "access": "eyJ...", "refresh": "eyJ..." }
    
    OUR response (adds user info):
        {
            "access": "eyJ...",
            "refresh": "eyJ...",
            "user": {
                "id": 1,
                "username": "akhil",
                "role": "COLLECTOR",
                "full_name": "Akhil Kumar"
            }
        }
    
    WHY: The frontend needs to know the user's role immediately after login
         (to show/hide menu items), without making a second API call.
    """

    def validate(self, attrs):
        """
        validate() is called when the serializer processes the login request.
        
        1. Call parent's validate() → checks username/password, generates tokens
        2. Add user info to the response data
        """
        # Parent validates credentials and generates tokens
        data = super().validate(attrs)

        # Add user information to the response
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint.
    
    POST /api/auth/login/
    
    Request:
        {
            "username": "akhil",
            "password": "mypass123"
        }
    
    Success Response (200):
        {
            "access": "eyJhbGci...",
            "refresh": "eyJhbGci...",
            "user": {
                "id": 2,
                "username": "akhil",
                "email": "akhil@ganeshyouth.com",
                "full_name": "Akhil Kumar",
                "role": "COLLECTOR",
                "mobile_number": "9876543210"
            }
        }
    
    Error Response (401):
        {
            "success": false,
            "message": "No active account found with the given credentials"
        }
    
    PERMISSION: AllowAny — anyone can attempt to log in.
    """
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh access token.
    
    POST /api/auth/refresh/
    
    WHY: Access tokens expire quickly (60 min). Instead of asking the user
         to log in again, the frontend sends the refresh token to get a 
         new access token silently.
    
    Request:
        { "refresh": "eyJhbGci..." }
    
    Response:
        { "access": "eyJhbGci...(new)...", "refresh": "eyJhbGci...(new)..." }
    
    NOTE: ROTATE_REFRESH_TOKENS=True in settings means:
        - Old refresh token is blacklisted (can't be reused)
        - A new refresh token is issued
        - This prevents token replay attacks
    """
    pass  # Uses SimpleJWT's built-in logic — no customization needed


class MeView(APIView):
    """
    Get current user's profile.
    
    GET /api/auth/me/
    
    WHY: After page refresh, the frontend needs to re-fetch the user's info.
         The JWT token only contains the user ID — this endpoint returns
         the full profile.
    
    Request:
        Headers: Authorization: Bearer eyJhbGci...
    
    Response (200):
        {
            "id": 2,
            "username": "akhil",
            "email": "akhil@ganeshyouth.com",
            "full_name": "Akhil Kumar",
            "role": "COLLECTOR",
            "mobile_number": "9876543210"
        }
    
    Error (401 — no token or expired):
        {
            "success": false,
            "message": "Authentication credentials were not provided."
        }
    
    PERMISSION: IsAuthenticated — must have a valid JWT token.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """
    Logout by blacklisting the refresh token.
    
    POST /api/auth/logout/
    
    WHY: JWTs are stateless — the server doesn't track active sessions.
         To "logout", we blacklist the refresh token so it can't be used
         to generate new access tokens. The current access token will
         still work until it expires (that's why access tokens are short-lived).
    
    Request:
        { "refresh": "eyJhbGci..." }
    
    Response (200):
        { "message": "Successfully logged out." }
    
    TESTING:
        1. Login → get tokens
        2. Logout → send refresh token
        3. Try to refresh with the same token → should fail (401)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'success': False, 'message': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'success': True, 'message': 'Successfully logged out.'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'success': False, 'message': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserListCreateView(APIView):
    """
    List all users or create a new user (Admin only).
    
    GET /api/auth/users/
        → List all committee members
    
    POST /api/auth/users/
        → Create a new user (admin, treasurer, or collector)
    
    Request (POST):
        {
            "username": "akhil",
            "password": "securepass123",
            "full_name": "Akhil Kumar",
            "role": "COLLECTOR",
            "email": "akhil@ganeshyouth.com",
            "mobile_number": "9876543210"
        }
    
    Response (201):
        {
            "id": 2,
            "username": "akhil",
            "email": "akhil@ganeshyouth.com",
            "full_name": "Akhil Kumar",
            "role": "COLLECTOR",
            "mobile_number": "9876543210"
        }
    
    PERMISSION: IsAdmin — only admin can create/view users.
    
    WHY NOT A ViewSet: User management is admin-only with special logic
    (password hashing). Keeping it as APIView gives us explicit control.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RegisterView(APIView):
    """
    Public self-registration endpoint for new committee members & collectors.
    
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for instant auto-login
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                'success': True,
                'message': 'Account registered successfully!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data,
            },
            status=status.HTTP_201_CREATED
        )


class ForgotUsernameView(APIView):
    """
    Recover a forgotten username using the registered mobile number.
    
    POST /api/auth/forgot-username/
    
    Request:
        { "mobile_number": "9876543210" }
    
    Success Response (200):
        {
            "success": true,
            "message": "Username found for this mobile number.",
            "username": "ra***sh"
        }
    
    Error Response (404):
        {
            "success": false,
            "message": "No account found with this mobile number."
        }
    
    SECURITY:
        - Returns a PARTIALLY MASKED username (e.g. "ra***sh") so it doesn't
          fully expose the username to anyone who knows the phone number.
        - AllowAny permission — no token required (user is locked out).
    """
    permission_classes = [AllowAny]

    def _mask_username(self, username):
        """
        Mask the middle portion of a username for privacy.
        Examples:
            "ramesh123" → "ra*****23"
            "abc"       → "a*c"
            "ab"        → "a*"
            "a"         → "a"
        """
        length = len(username)
        if length <= 1:
            return username
        if length <= 3:
            return username[0] + '*' * (length - 2) + username[-1]
        # Show first 2 and last 2 characters, mask the rest
        visible = 2
        return username[:visible] + '*' * (length - visible * 2) + username[-visible:]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        mobile_number = request.data.get('mobile_number', '').strip()
        if not mobile_number:
            return Response(
                {'success': False, 'message': 'Mobile number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(mobile_number=mobile_number, is_active=True)
            masked = self._mask_username(user.username)
            return Response({
                'success': True,
                'message': 'Username found for this mobile number.',
                'username': masked,
            })
        except User.DoesNotExist:
            return Response(
                {'success': False, 'message': 'No account found with this mobile number.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ResetPasswordView(APIView):
    """
    Reset a forgotten password by verifying username + registered mobile number.
    
    POST /api/auth/reset-password/
    
    Request:
        {
            "username": "ramesh123",
            "mobile_number": "9876543210",
            "new_password": "MyNewPass456"
        }
    
    Success Response (200):
        {
            "success": true,
            "message": "Password has been reset successfully. You can now sign in."
        }
    
    Error Response (400):
        {
            "success": false,
            "message": "Username and mobile number do not match any account."
        }
    
    SECURITY:
        - Requires BOTH username AND mobile number to match — prevents brute force.
        - Django's password validators are enforced on the new password.
        - AllowAny permission — no token required (user is locked out).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        User = get_user_model()

        username = request.data.get('username', '').strip()
        mobile_number = request.data.get('mobile_number', '').strip()
        new_password = request.data.get('new_password', '')

        # Validate all fields are present
        if not username or not mobile_number or not new_password:
            return Response(
                {'success': False, 'message': 'Username, mobile number, and new password are all required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Look up user by username + mobile_number combination
        try:
            user = User.objects.get(
                username=username,
                mobile_number=mobile_number,
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Username and mobile number do not match any account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the new password against Django's password validators
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response(
                {'success': False, 'message': ' '.join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set the new password (hashes it with PBKDF2)
        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({
            'success': True,
            'message': 'Password has been reset successfully. You can now sign in.',
        })

