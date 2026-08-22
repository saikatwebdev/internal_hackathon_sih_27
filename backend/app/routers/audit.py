from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import require_super_admin
from app.database.models import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "role": l.role,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "old_data": l.old_data,
            "new_data": l.new_data,
            "created_at": l.created_at,
        }
        for l in logs
    ]
