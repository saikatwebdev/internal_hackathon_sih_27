from datetime import datetime, date, time
from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import require_faculty, require_scanner, get_current_user
from app.database.models import Student, ClassSession, Attendance, AttendanceEvent, AuditLog
from app.services.qr_service import qr_service
from app.services.face_service import face_service
from app.services.attendance_service import attendance_service
from app.schemas.attendance import ManualOverrideRequest, EntryRequest, ExitRequest

router = APIRouter(prefix="/attendance", tags=["Attendance System"])


class AttendanceEntryRequest(BaseModel):
    qr_token: Optional[str] = None
    roll: Optional[str] = None
    subject_code: Optional[str] = None
    date: Optional[str] = None
    entry_time: Optional[str] = None
    face_image: str
    scanner_id: str


class AttendanceExitRequest(BaseModel):
    qr_token: Optional[str] = None
    roll: Optional[str] = None
    session_id: Optional[str] = None
    exit_time: Optional[str] = None
    scanner_id: str


@router.post("/entry")
async def record_attendance_entry(
    req: AttendanceEntryRequest,
    db: Session = Depends(get_db),
):
    """
    Entry verification flow:
    1. Parse dynamic QR JSON string or request roll.
    2. Enforce strict Database lookup for Student by Roll Number.
    3. Verify class session.
    4. Call External Face Model API (https://face-recognition-test-model.onrender.com/upload).
    5. Record entry in PostgreSQL database.
    """
    qr_payload = {}
    if req.qr_token:
        is_valid, payload, err = qr_service.validate_qr_token(req.qr_token)
        if not is_valid:
            if err == "QR_EXPIRED":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "QR_EXPIRED",
                        "message": "QR Code has expired (exceeded 10s validity). Please present the newly generated QR code.",
                    },
                )
            elif err == "QR_ALREADY_USED":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "QR_ALREADY_USED",
                        "message": "This QR Code token has already been scanned and used.",
                    },
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail={"error_code": "QR_INVALID", "message": f"Invalid QR token: {err}"},
                )
        qr_payload = payload

    # Reject Exit QR codes presented during Entry scan
    qr_type = (qr_payload.get("type") or qr_payload.get("qr_type") or "").upper()
    if qr_type == "EXIT" or ("exit_time" in qr_payload and "entry_time" not in qr_payload):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_QR_TYPE",
                "message": "Exit QR code cannot be used for classroom entry scan. Please present your Entry QR code.",
            },
        )

    target_roll = qr_payload.get("roll") or req.roll
    if not target_roll:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "ROLL_REQUIRED", "message": "Student roll number is required in QR code"},
        )

    # Strict Database Verification for Student Roll Number
    student = db.query(Student).filter(Student.roll_no == target_roll).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail={
                "error_code": "STUDENT_NOT_FOUND",
                "message": f"Student with roll number '{target_roll}' does not exist in college database.",
            },
        )

    target_subject = qr_payload.get("subject_code") or req.subject_code or "AI301"
    session = (
        db.query(ClassSession)
        .filter(
            ClassSession.branch_id == student.branch_id,
            ClassSession.year == student.year,
            ClassSession.semester == student.semester,
            ClassSession.section == student.section,
            ClassSession.status == "active",
        )
        .first()
    )

    if not session:
        session = db.query(ClassSession).filter(ClassSession.branch_id == student.branch_id).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "SESSION_NOT_FOUND", "message": "No active class session found for student"},
        )

    # Perform Face Verification via External API https://face-recognition-test-model.onrender.com/upload
    face_res = await face_service.verify_face_identity(
        face_image_base64=req.face_image,
        expected_student_id=student.id,
        expected_roll_no=student.roll_no,
        expected_face_ref_id=student.face_reference_id,
    )

    if not face_res.get("matched"):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": face_res.get("status_code", "FACE_MISMATCH"),
                "message": face_res.get("message", "Face verification failed for student photo."),
            },
        )

    # Record Entry using attendance_service.record_entry
    result = attendance_service.record_entry(
        db=db,
        class_session=session,
        student=student,
        scanner_id=req.scanner_id,
        qr_verified=True,
        face_verified=True,
        face_confidence=face_res.get("confidence", 0.98),
    )

    if not result.get("success") and result.get("status_code") == "ALREADY_ENTERED":
        attendance = result.get("attendance")
        return {
            "success": True,
            "status": "ALREADY_ENTERED",
            "message": "Student has already entered for this session.",
            "student": {"id": student.id, "roll_no": student.roll_no, "name": student.name},
            "attendance_id": attendance.id if attendance else None,
            "entry_time": attendance.entry_time.strftime("%H:%M:%S") if attendance and attendance.entry_time else None,
        }

    attendance = result.get("attendance")
    now_dt = datetime.now()

    return {
        "success": True,
        "status": "ENTRY_RECORDED",
        "student": {
            "id": student.id,
            "roll_no": student.roll_no,
            "name": student.name,
        },
        "session": {
            "id": session.id,
            "subject_code": session.subject.subject_code if session.subject else target_subject,
        },
        "attendance_id": attendance.id if attendance else None,
        "entry_time": attendance.entry_time.strftime("%H:%M:%S") if attendance and attendance.entry_time else now_dt.strftime("%H:%M:%S"),
        "face_verification": face_res,
    }


@router.post("/exit")
async def record_attendance_exit(
    req: AttendanceExitRequest,
    db: Session = Depends(get_db),
):
    """
    Exit verification flow:
    1. Parse Exit QR JSON string: {"roll": "23AI045", "session_id": "...", "exit_time": "11:20"}
    2. Lookup Student and Session in PostgreSQL Database.
    3. Update exit timestamp and calculate final attendance status.
    """
    qr_payload = {}
    if req.qr_token:
        is_valid, payload, err = qr_service.validate_qr_token(req.qr_token)
        if not is_valid:
            if err == "QR_EXPIRED":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "QR_EXPIRED",
                        "message": "Exit QR Code has expired (exceeded 10s validity). Please present the newly generated Exit QR code.",
                    },
                )
            elif err == "QR_ALREADY_USED":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "QR_ALREADY_USED",
                        "message": "This Exit QR Code token has already been scanned and used.",
                    },
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail={"error_code": "QR_INVALID", "message": f"Invalid Exit QR token: {err}"},
                )
        qr_payload = payload

    # Reject Entry QR codes presented during Exit scan
    qr_type = (qr_payload.get("type") or qr_payload.get("qr_type") or "").upper()
    if qr_type == "ENTRY" or ("entry_time" in qr_payload and "exit_time" not in qr_payload):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_QR_TYPE",
                "message": "Entry QR code cannot be used for classroom exit scan. Please present your Exit QR code.",
            },
        )

    target_roll = qr_payload.get("roll") or req.roll
    target_session_id = qr_payload.get("session_id") or req.session_id

    if not target_roll:
        raise HTTPException(status_code=400, detail="Student roll number required")

    # Strict Student Database Verification
    student = db.query(Student).filter(Student.roll_no == target_roll).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "STUDENT_NOT_FOUND", "message": f"Student roll '{target_roll}' not found in database."},
        )

    session = None
    if target_session_id:
        session = db.query(ClassSession).filter(ClassSession.id == target_session_id).first()

    if not session:
        session = db.query(ClassSession).filter(ClassSession.branch_id == student.branch_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active session found for student")

    result = attendance_service.record_exit(
        db=db,
        class_session=session,
        student=student,
        scanner_id=req.scanner_id,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": result.get("status_code", "EXIT_FAILED"),
                "message": result.get("message", "Exit denied: You must complete Entry scan before exiting."),
            },
        )

    attendance = result.get("attendance")

    return {
        "success": True,
        "status": "EXIT_RECORDED",
        "student_roll": student.roll_no,
        "session_id": session.id,
        "exit_time": attendance.exit_time.strftime("%H:%M:%S") if attendance and attendance.exit_time else None,
        "duration_minutes": result.get("duration_minutes"),
        "attendance_status": result.get("attendance_status"),
    }


@router.get("/session/{session_id}")
def get_virtual_spreadsheet(
    session_id: str,
    db: Session = Depends(get_db),
    current=Depends(require_faculty),
):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    matrix_data = attendance_service.get_virtual_spreadsheet_data(db, session_id)
    return matrix_data


@router.post("/manual-correct")
def manual_attendance_correction(
    req: ManualOverrideRequest,
    db: Session = Depends(get_db),
    current=Depends(require_faculty),
):
    faculty = current["user"]
    result = attendance_service.manual_override(
        db=db,
        student_id=req.student_id,
        class_session_id=req.class_session_id if hasattr(req, 'class_session_id') else "",
        new_status=req.status,
        reason=req.reason,
        performed_by_id=faculty.id,
        performed_by_role="faculty",
    )
    attendance = result.get("attendance")
    return {
        "success": True,
        "attendance_id": attendance.id if attendance else None,
        "new_status": req.status,
        "override_reason": req.reason,
    }
