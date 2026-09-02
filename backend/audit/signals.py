from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict

from donations.models import Donation
from expenses.models import Expense
from donors.models import Donor
from planning.models import PlannedExpense
from festivals.models import Festival, CommitteeMember
from accounts.models import User
from .services import log_action

# Track pre-save state in memory to capture old_values on update
_pre_save_snapshots = {}

TRACKED_MODELS = (Donation, Expense, Donor, PlannedExpense, Festival, CommitteeMember, User)


def _get_model_snapshot(instance):
    """Serialize relevant model fields into a dictionary."""
    data = {}
    for field in instance._meta.fields:
        # Avoid foreign key object serialization issues
        val = getattr(instance, field.name, None)
        if hasattr(val, 'pk'):
            data[field.name] = val.pk
        else:
            data[field.name] = val
    return data


@receiver(pre_save)
def track_pre_save(sender, instance, **kwargs):
    if sender in TRACKED_MODELS and instance.pk:
        try:
            old_instance = sender.objects.filter(pk=instance.pk).first()
            if old_instance:
                _pre_save_snapshots[f"{sender.__name__}_{instance.pk}"] = _get_model_snapshot(old_instance)
        except Exception:
            pass


@receiver(post_save)
def track_post_save(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    model_name = sender.__name__
    record_id = instance.pk
    new_snapshot = _get_model_snapshot(instance)

    # Determine actor (user)
    actor = getattr(instance, 'collected_by', None) or getattr(instance, 'created_by', None) or getattr(instance, 'paid_by', None)

    if created:
        log_action(
            action='CREATE',
            model_name=model_name,
            record_id=record_id,
            user=actor,
            new_values=new_snapshot,
        )
    else:
        snapshot_key = f"{model_name}_{record_id}"
        old_snapshot = _pre_save_snapshots.pop(snapshot_key, None)
        log_action(
            action='UPDATE',
            model_name=model_name,
            record_id=record_id,
            user=actor,
            old_values=old_snapshot,
            new_values=new_snapshot,
        )


@receiver(post_delete)
def track_post_delete(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    model_name = sender.__name__
    record_id = instance.pk
    snapshot = _get_model_snapshot(instance)
    actor = getattr(instance, 'collected_by', None) or getattr(instance, 'created_by', None) or getattr(instance, 'paid_by', None)

    log_action(
        action='DELETE',
        model_name=model_name,
        record_id=record_id,
        user=actor,
        old_values=snapshot,
    )
