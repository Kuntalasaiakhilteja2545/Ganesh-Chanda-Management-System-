"""
Festival & Committee Models
"""

from django.db import models
from common.models import TimestampMixin


class Festival(TimestampMixin, models.Model):
    """
    Each row = one Ganesh Chanda year / association event.
    """
    name = models.CharField(
        max_length=100,
        help_text='Festival name in English, e.g., "Ganesh Chanda 2026"'
    )
    name_telugu = models.CharField(
        max_length=100,
        blank=True,
        help_text='Festival name in Telugu, e.g., "గణేష్ చందా 2026"'
    )
    association_name = models.CharField(
        max_length=200,
        blank=True,
        default='Ganesh Youth Association',
        help_text='Youth association / committee name, e.g., "Jai Hind Ganesh Youth Association"'
    )
    association_name_telugu = models.CharField(
        max_length=200,
        blank=True,
        default='గణేష్ యువజన సంఘం',
        help_text='Youth association name in Telugu'
    )
    year = models.PositiveIntegerField(
        unique=True,
        help_text='Festival year (e.g., 2026). Must be unique.'
    )
    start_date = models.DateField(
        null=True, blank=True,
        help_text='When donation collection starts'
    )
    end_date = models.DateField(
        null=True, blank=True,
        help_text='When the festival ends'
    )
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text='Location / Colony / Street of the Ganesh pandal'
    )
    landmark = models.CharField(
        max_length=200,
        blank=True,
        help_text='Landmark or specific stage spot'
    )
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Only ONE festival should be active at a time (current year)'
    )
    upi_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='UPI ID for receiving donations, e.g., "ganeshyouth@phonepe"'
    )
    qr_code_image = models.TextField(
        blank=True,
        default='',
        help_text='Base64 QR code image or URL for UPI payments'
    )

    class Meta:
        db_table = 'festivals'
        ordering = ['-year']

    def __str__(self):
        return f"{self.name} ({self.year})"

    def save(self, *args, **kwargs):
        if self.is_active:
            qs = Festival.objects.filter(is_active=True).exclude(pk=self.pk)
            if self.association_name:
                qs = qs.filter(association_name__iexact=self.association_name.strip())
            qs.update(is_active=False)
        super().save(*args, **kwargs)


class CommitteeMember(TimestampMixin, models.Model):
    """
    Youth committee members & organizers (President, Secretary, Treasurer, Members, etc.)
    """
    DESIGNATION_CHOICES = [
        ('PRESIDENT', 'President / అధ్యక్షుడు'),
        ('VICE_PRESIDENT', 'Vice President / ఉపాధ్యక్షుడు'),
        ('SECRETARY', 'General Secretary / ప్రధాన కార్యదర్శి'),
        ('JOINT_SECRETARY', 'Joint Secretary / సహాయ కార్యదర్శి'),
        ('TREASURER', 'Treasurer / కోశాధికారి'),
        ('ADVISOR', 'Advisor / గౌరవ సలహాదారు'),
        ('YOUTH_LEADER', 'Youth Leader / యువజన నాయకుడు'),
        ('EXECUTIVE_MEMBER', 'Executive Member / కార్యవర్గ సభ్యుడు'),
        ('MEMBER', 'Member / సభ్యుడు'),
        ('VOLUNTEER', 'Volunteer / స్వచ్ఛంద సేవకుడు'),
    ]

    festival = models.ForeignKey(
        Festival,
        on_delete=models.CASCADE,
        related_name='committee_members',
        help_text='Festival year this committee belongs to'
    )
    name = models.CharField(
        max_length=150,
        help_text='Full name of the youth committee member'
    )
    name_telugu = models.CharField(
        max_length=150,
        blank=True,
        help_text='Member name in Telugu'
    )
    designation = models.CharField(
        max_length=50,
        choices=DESIGNATION_CHOICES,
        default='MEMBER',
        help_text='Role/Designation in the Ganesh Youth Committee'
    )
    custom_designation = models.CharField(
        max_length=100,
        blank=True,
        help_text='Optional custom designation in English'
    )
    custom_designation_telugu = models.CharField(
        max_length=100,
        blank=True,
        help_text='Optional custom designation in Telugu'
    )
    mobile_number = models.CharField(
        max_length=15,
        blank=True,
        help_text='Contact phone number'
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text='Order in which member appears on committee list & banners'
    )
    photo = models.TextField(
        blank=True,
        help_text='Base64 or photo URL of committee member'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Is active member for this year'
    )

    class Meta:
        db_table = 'committee_members'
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.name} - {self.get_designation_display()} ({self.festival.year})"
