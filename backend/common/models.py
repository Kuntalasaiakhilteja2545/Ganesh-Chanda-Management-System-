"""
Common Model Mixins

WHAT: Reusable base classes that add common fields to multiple models.
WHY:  Every model in our system needs created_at/updated_at timestamps.
      Financial models also need soft-delete (never permanently destroy records).
      Instead of repeating these fields in 8 models, we define them ONCE.

HOW IT WORKS:
    class Donation(TimestampMixin, SoftDeleteMixin, models.Model):
        ...
    
    This gives Donation all 4 fields: created_at, updated_at, is_deleted, deleted_at.

WHERE: Imported in every app's models.py

COMMON MISTAKE:
    Forgetting to filter out soft-deleted records in queries. That's why we
    provide ActiveManager — use it as default_manager so .all() automatically
    excludes deleted records.
"""

from django.db import models


class TimestampMixin(models.Model):
    """
    Adds created_at and updated_at to any model.
    
    created_at: Set automatically when a record is first created.
                auto_now_add=True means Django fills this on INSERT.
    
    updated_at: Set automatically every time the record is saved.
                auto_now=True means Django fills this on every UPDATE.
    
    db_index=True on created_at: We often sort/filter by creation date,
    so an index makes these queries fast.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # This model is NEVER created as a table.
                         # It only provides fields to child models.


class ActiveManager(models.Manager):
    """
    Custom manager that automatically filters out soft-deleted records.
    
    WHY: If you do Donation.objects.all(), you want to see only active donations.
         Deleted ones should only be visible through Donation.all_objects.all().
    
    HOW: This overrides get_queryset() to add .filter(is_deleted=False).
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class SoftDeleteMixin(models.Model):
    """
    Adds soft-delete capability.
    
    WHAT: Instead of DELETE FROM donations WHERE id=25, we set is_deleted=True.
    
    WHY: Financial records should NEVER be permanently destroyed.
         Auditors need to see what was deleted and when.
    
    HOW:
        donation.soft_delete()  # Sets is_deleted=True, deleted_at=now
        donation.restore()      # Sets is_deleted=False, deleted_at=None
    
    MANAGERS:
        Donation.objects.all()      → Only active records (via ActiveManager)
        Donation.all_objects.all()  → ALL records including deleted ones
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Default manager — excludes deleted records
    objects = ActiveManager()
    
    # Fallback manager — includes everything (for admin/audit)
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    def restore(self):
        """Undo a soft delete."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])
