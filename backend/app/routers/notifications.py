from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.services.notification_service import notification_service
from app.database.models import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_my_notifications(
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    notifs = notification_service.get_user_notifications(db, current["user_id"])
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    success = notification_service.mark_as_read(db, notification_id, current["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}
