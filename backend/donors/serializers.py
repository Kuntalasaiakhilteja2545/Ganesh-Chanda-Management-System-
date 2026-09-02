"""
Donor Serializer
"""

from rest_framework import serializers
from .models import Donor


class DonorSerializer(serializers.ModelSerializer):
    """
    Donor CRUD serializer.
    
    API Input (POST /api/donors/):
        {
            "name": "Ravi Kumar",
            "mobile_number": "9876543210",
            "address": "Hyderabad",
            "notes": "Regular donor"
        }
    
    API Output:
        {
            "id": 1,
            "name": "Ravi Kumar",
            "mobile_number": "9876543210",
            "address": "Hyderabad",
            "notes": "Regular donor",
            "created_at": "2026-08-14T09:30:00+05:30",
            "updated_at": "2026-08-14T09:30:00+05:30"
        }
    """

    class Meta:
        model = Donor
        fields = [
            'id',
            'name',
            'mobile_number',
            'address',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DonorPublicSerializer(serializers.ModelSerializer):
    """
    Public-safe serializer — HIDES mobile number, address, notes.
    
    WHY: Public dashboard should show donor names but NOT private info.
    We use a SEPARATE serializer instead of trying to conditionally
    hide fields in one serializer.
    """

    class Meta:
        model = Donor
        fields = ['id', 'name']
