from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import require_faculty, require_super_admin, get_current_user
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Report Generation"])


@router.get("/export/csv/{session_id}")
def export_class_attendance_csv(
    session_id: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    csv_content = report_service.export_session_csv(db, session_id)
    if not csv_content:
        raise HTTPException(status_code=404, detail="No session records found")

    filename = f"attendance_session_{session_id[:8]}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/excel/{session_id}")
def export_class_attendance_excel(
    session_id: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    excel_bytes = report_service.export_session_excel(db, session_id)
    if not excel_bytes:
        raise HTTPException(status_code=404, detail="No session records found")

    filename = f"attendance_session_{session_id[:8]}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
