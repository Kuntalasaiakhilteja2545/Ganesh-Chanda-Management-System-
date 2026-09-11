"""
Account Serializers

WHAT: Serializers convert data between JSON (what the API sends/receives)
      and Python objects (what Django/DRF works with internally).

WHY SERIALIZERS MATTER:
    When React sends: {"username": "akhil", "password": "mypass123"}
    The serializer:
    1. VALIDATES the data (are both fields present? Is password correct?)
    2. CONVERTS it to Python objects
    3. Returns the result (JWT tokens or error messages)

    When Django sends user data back, the serializer:
    1. CONVERTS the User model to JSON
    2. CONTROLS which fields are exposed (never expose password!)

HOW IT CONNECTS:
    React → JSON request → Serializer (validate) → View (process) → Serializer (output) → JSON response

REAL-WORLD EXAMPLE:
    Akhil (collector) opens the app → enters username/password → 
    LoginSerializer validates → SimpleJWT generates tokens →
    Response: { access, refresh } → Akhil stores tokens in localStorage

COMMON MISTAKES:
    1. Exposing password in UserSerializer (NEVER include 'password' in fields)
    2. Not making password write-only in registration
    3. Returning sensitive data like email in public responses
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model — used to DISPLAY user information.
    
    ModelSerializer automatically:
    1. Creates fields from the model (no need to define each one)
    2. Creates validators from model constraints
    3. Implements create() and update()
    
    'fields' controls EXACTLY which fields are exposed in the API.
    Notice: 'password' is NOT in the list — it's NEVER returned.
    
    Usage:
        GET /api/auth/me/ → Returns this serialized data
        Shows: id, username, email, full_name, role, mobile_number
        Hides: password, is_superuser, internal Django fields
    """

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'role',
            'mobile_number',
            'association_name',
            'is_active',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (Admin only).
    
    WHY SEPARATE FROM UserSerializer:
        - UserSerializer is for READING (GET /api/auth/me/)
        - UserCreateSerializer is for WRITING (POST /api/users/)
        - Password must be write_only (accept it, but never return it)
        - Password must be hashed (not stored as plain text)
    
    IMPORTANT: We override create() to use set_password() instead of
    saving the raw password. Django's set_password() hashes it with PBKDF2.
    
    COMMON MISTAKE:
        User.objects.create(password='mypass')  ← WRONG! Stores plain text!
        User.objects.create_user(password='mypass')  ← CORRECT! Hashes it!
    """
    password = serializers.CharField(
        write_only=True,  # Accept in request, never include in response
        min_length=6,
        style={'input_type': 'password'}  # Shows dots in BrowsableAPI
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'full_name',
            'role',
            'mobile_number',
            'association_name',
        ]
        read_only_fields = ['id']

    def validate_mobile_number(self, value):
        mobile = (value or '').strip()
        if mobile:
            digits_only = ''.join(c for c in mobile if c.isdigit())
            # Check exact match or last 10 digits match
            if User.objects.filter(mobile_number=mobile).exists() or (len(digits_only) >= 10 and User.objects.filter(mobile_number__icontains=digits_only[-10:]).exists()):
                raise serializers.ValidationError(
                    'This mobile number is already registered with another account.'
                )
        return mobile

    def validate_username(self, value):
        username = (value or '').strip()
        if username:
            if User.objects.filter(username__iexact=username).exists():
                raise serializers.ValidationError(
                    'This username is already taken. Please choose another username.'
                )
        return username

    def create(self, validated_data):
        """
        Override create to properly hash the password.
        
        create_user() does TWO things:
        1. Hashes the password with PBKDF2
        2. Saves the user to the database
        """
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login request validation.
    
    NOTE: This is a plain Serializer, NOT ModelSerializer.
    WHY: Login doesn't create/update a model — it just validates credentials.
    
    We use SimpleJWT's TokenObtainPairView for the actual token generation.
    This serializer is here as documentation of what the login endpoint expects.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
