import json
from decimal import Decimal
from datetime import date, datetime
from .models import AuditLog
from .middleware import get_audit_context


def _json_serializable(val):
    """Convert Django model fields to JSON-serializable primitives."""
    if isinstance(val, (Decimal, float)):
        return str(val)
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: _json_serializable(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_json_serializable(v) for v in val]
    return val


def log_action(
    action,
    model_name,
    record_id,
    user=None,
    old_values=None,
    new_values=None,
    ip_address=None,
    user_agent=None,
):
    """
    Record an immutable audit log entry.
    
    Automatically pulls IP, User-Agent, and current user from thread-local context
    if not explicitly passed.
    """
    ctx = get_audit_context()
    
    final_user = user or ctx.get('user')
    final_ip = ip_address or ctx.get('ip_address')
    final_ua = user_agent or ctx.get('user_agent', '')

    # Filter out sensitive fields
    clean_old = _sanitize_values(old_values) if old_values else None
    clean_new = _sanitize_values(new_values) if new_values else None

    try:
        return AuditLog.objects.create(
            user=final_user if (final_user and final_user.is_authenticated) else None,
            action=action,
            model_name=model_name,
            record_id=record_id,
            old_values=clean_old,
            new_values=clean_new,
            ip_address=final_ip,
            user_agent=final_ua,
        )
    except Exception as e:
        # Never crash the main transaction if logging encounters an issue
        print(f"[AuditLog Error] Failed to record audit log: {e}")
        return None


def _sanitize_values(data):
    if not isinstance(data, dict):
        return data
    sanitized = {}
    SENSITIVE_KEYS = {'password', 'token', 'secret', 'refresh_token', 'access_token'}
    for k, v in data.items():
        if any(s in k.lower() for s in SENSITIVE_KEYS):
            sanitized[k] = '********'
        else:
            sanitized[k] = _json_serializable(v)
    return sanitized
