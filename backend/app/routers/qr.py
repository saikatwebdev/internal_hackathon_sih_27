from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_student
from app.services.qr_service import qr_service
from app.database.models import ClassSession, Student

router = APIRouter(prefix="/qr", tags=["QR Generation & Validation"])


class QRGenerateRequest(BaseModel):
    session_id: str
    type: Optional[str] = "ENTRY"  # ENTRY or EXIT


class QRDecodeRequest(BaseModel):
    qr_token: str


@router.post("/generate")
def generate_qr_code_token(
    req: QRGenerateRequest,
    db: Session = Depends(get_db),
    current=Depends(require_student),
):
    student = current["user"]
    session = db.query(ClassSession).filter(ClassSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    if session.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot generate QR for cancelled class")

    subject_code = session.subject.subject_code if session.subject else "AI301"

    if req.type == "EXIT":
        qr_data = qr_service.generate_exit_qr_json(
            roll_no=student.roll_no,
            class_session_id=session.id,
        )
    else:
        qr_data = qr_service.generate_entry_qr_json(
            roll_no=student.roll_no,
            student_id=student.id,
            subject_code=subject_code,
            class_session_id=session.id,
            face_image_ref=student.face_reference_id or f"FACE_REF_{student.roll_no}",
        )

    return qr_data


@router.post("/decode-student")
def decode_student_qr_token(
    req: QRDecodeRequest,
    db: Session = Depends(get_db),
):
    """
    Decodes a scanned QR token string and fetches student & session info from database.
    """
    is_valid, payload, err = qr_service.validate_qr_token(req.qr_token)
    if not is_valid or not payload:
        raise HTTPException(
            status_code=400,
            detail={"error_code": err or "QR_INVALID", "message": f"QR Validation failed: {err}"},
        )

    target_roll = payload.get("roll")
    class_session_id = payload.get("session_id")

    if not target_roll:
        raise HTTPException(status_code=400, detail={"error_code": "ROLL_MISSING", "message": "Roll number missing from QR code"})

    # Strict DB Lookup for Student
    student = db.query(Student).filter(Student.roll_no == target_roll).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "STUDENT_NOT_FOUND", "message": f"Student with roll '{target_roll}' not found in database"},
        )

    session = None
    if class_session_id:
        session = db.query(ClassSession).filter(ClassSession.id == class_session_id).first()

    if not session:
        session = db.query(ClassSession).filter(ClassSession.branch_id == student.branch_id).first()

    return {
        "success": True,
        "student": {
            "id": student.id,
            "roll_no": student.roll_no,
            "name": student.name,
            "branch_id": student.branch_id,
        },
        "session": {
            "id": session.id if session else "",
            "subject_code": session.subject.subject_code if session and session.subject else payload.get("subject_code", "AI301"),
            "subject_name": session.subject.subject_name if session and session.subject else "Machine Learning",
        },
        "qr_payload": payload,
    }
