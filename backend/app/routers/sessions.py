from typing import List, Optional
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_faculty, require_super_admin
from app.schemas.session import SessionCreate, SessionUpdate, SessionOut
from app.database.models import ClassSession, ClassSessionChange, Subject, Classroom, Student, AuditLog

router = APIRouter(prefix="/sessions", tags=["Class Sessions"])


@router.get("", response_model=List[SessionOut])
def get_sessions(
    faculty_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    year: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    class_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    role = current["role"]
    query = db.query(ClassSession)

    if role == "student":
        student = current["user"]
        query = query.filter(
            ClassSession.branch_id == student.branch_id,
            ClassSession.year == student.year,
            ClassSession.semester == student.semester,
            ClassSession.section == student.section,
        )
    elif role == "faculty" and not faculty_id:
        query = query.filter(ClassSession.faculty_id == current["user_id"])
    elif faculty_id:
        query = query.filter(ClassSession.faculty_id == faculty_id)

    if branch_id:
        query = query.filter(ClassSession.branch_id == branch_id)
    if year:
        query = query.filter(ClassSession.year == year)
    if semester:
        query = query.filter(ClassSession.semester == semester)
    if section:
        query = query.filter(ClassSession.section == section)
    if class_date:
        query = query.filter(ClassSession.class_date == class_date)
    if status_filter:
        query = query.filter(ClassSession.status == status_filter)

    return query.order_by(ClassSession.class_date.desc(), ClassSession.start_time.asc()).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db), current=Depends(get_current_user)):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")
    return session


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    req: SessionCreate,
    db: Session = Depends(get_db),
    current=Depends(require_faculty),
):
    # Validation 1: start_time < end_time
    if req.start_time >= req.end_time:
        raise HTTPException(status_code=400, detail="Start time must be earlier than end time")

    # Calculate total class time in minutes
    dummy_date = date.today()
    dt_start = datetime.combine(dummy_date, req.start_time)
    dt_end = datetime.combine(dummy_date, req.end_time)
    total_class_minutes = int((dt_end - dt_start).total_seconds() / 60)

    # Rule: Default minimum attendance duration = 60% of class time; Cap must be strictly < 75%
    default_min_duration = max(1, int(0.60 * total_class_minutes))
    max_allowed_duration = int(0.749 * total_class_minutes)

    min_duration = req.minimum_duration_minutes if req.minimum_duration_minutes else default_min_duration

    if min_duration >= (0.75 * total_class_minutes):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum required attendance duration ({min_duration} mins) must be less than 75% of total class time ({int(0.75 * total_class_minutes)} mins).",
        )

    # Validation 2: Subject check
    subj = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    session_branch_id = subj.branch_id if subj and subj.branch_id else req.branch_id
    session_year = subj.year if subj and subj.year else req.year
    session_semester = subj.semester if subj and subj.semester else req.semester

    # Validation 3: Classroom overlap check
    room_overlap = (
        db.query(ClassSession)
        .filter(
            ClassSession.classroom_id == req.classroom_id,
            ClassSession.class_date == req.class_date,
            ClassSession.status.in_(["scheduled", "active"]),
            and_(
                ClassSession.start_time < req.end_time,
                ClassSession.end_time > req.start_time,
            ),
        )
        .first()
    )
    if room_overlap:
        raise HTTPException(
            status_code=400, detail="Classroom is already booked during this time by another session"
        )

    # Validation 4: Faculty overlap check
    fac_overlap = (
        db.query(ClassSession)
        .filter(
            ClassSession.faculty_id == current["user_id"],
            ClassSession.class_date == req.class_date,
            ClassSession.status.in_(["scheduled", "active"]),
            and_(
                ClassSession.start_time < req.end_time,
                ClassSession.end_time > req.start_time,
            ),
        )
        .first()
    )
    if fac_overlap:
        raise HTTPException(
            status_code=400, detail="You already have an active/scheduled class session at this time"
        )

    # Determine valid faculty_id
    fac_id = current["user_id"]
    if current["role"] == "super_admin":
        fac_obj = db.query(Faculty).first()
        fac_id = req.faculty_id if req.faculty_id else (fac_obj.id if fac_obj else current["user_id"])

    session = ClassSession(
        subject_id=req.subject_id,
        faculty_id=fac_id,
        branch_id=session_branch_id,
        classroom_id=req.classroom_id,
        year=session_year,
        semester=session_semester,
        section=req.section or "A",
        class_date=req.class_date,
        start_time=req.start_time,
        end_time=req.end_time,
        allowed_late_minutes=req.allowed_late_minutes,
        minimum_duration_minutes=min_duration,
        status="scheduled",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.put("/{session_id}", response_model=SessionOut)
def update_session(
    session_id: str,
    req: SessionUpdate,
    db: Session = Depends(get_db),
    current=Depends(require_faculty),
):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    if current["role"] == "faculty" and session.faculty_id != current["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this session")

    if req.status is not None:
        old_status = session.status
        session.status = req.status
        change = ClassSessionChange(
            class_session_id=session.id,
            changed_by=current["user_id"],
            field_name="status",
            old_value=old_status,
            new_value=req.status,
            reason=req.reason or "Status updated",
        )
        db.add(change)

    if req.class_date is not None:
        session.class_date = req.class_date
    if req.start_time is not None:
        session.start_time = req.start_time
    if req.end_time is not None:
        session.end_time = req.end_time
    if req.classroom_id is not None:
        session.classroom_id = req.classroom_id

    db.commit()
    db.refresh(session)
    return session
