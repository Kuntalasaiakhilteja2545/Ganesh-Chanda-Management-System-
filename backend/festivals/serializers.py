from datetime import datetime
from rest_framework import serializers
from .models import Festival, CommitteeMember


class CommitteeMemberSerializer(serializers.ModelSerializer):
    festival = serializers.PrimaryKeyRelatedField(
        queryset=Festival.objects.all(),
        required=False,
        allow_null=True
    )
    festival_name = serializers.CharField(source='festival.name', read_only=True)
    designation_display = serializers.CharField(source='get_designation_display', read_only=True)

    class Meta:
        model = CommitteeMember
        fields = [
            'id',
            'festival',
            'festival_name',
            'name',
            'name_telugu',
            'designation',
            'designation_display',
            'custom_designation',
            'custom_designation_telugu',
            'mobile_number',
            'display_order',
            'photo',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('festival'):
            active = Festival.objects.filter(is_active=True).first() or Festival.objects.first()
            if not active:
                active = Festival.objects.create(
                    name=f"Ganesh Chanda {datetime.now().year}",
                    association_name="Ganesh Youth Association",
                    year=datetime.now().year,
                    is_active=True
                )
            attrs['festival'] = active
        return attrs


class FestivalSerializer(serializers.ModelSerializer):
    committee_members = CommitteeMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Festival
        fields = [
            'id',
            'name',
            'name_telugu',
            'association_name',
            'association_name_telugu',
            'year',
            'start_date',
            'end_date',
            'location',
            'landmark',
            'is_active',
            'upi_id',
            'qr_code_image',
            'committee_members',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
