from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import require_super_admin, get_current_user
from app.schemas.academic import (
    BranchCreate, BranchOut, SubjectCreate, SubjectOut,
    ClassroomCreate, ClassroomOut, EnrollmentCreate, EnrollmentOut
)
from app.database.models import Branch, Subject, Classroom, Enrollment

router = APIRouter(tags=["Academic Management"])


# --- BRANCHES ---
@router.get("/branches", response_model=List[BranchOut])
def get_branches(db: Session = Depends(get_db), current=Depends(get_current_user)):
    return db.query(Branch).all()


@router.post("/branches", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(req: BranchCreate, db: Session = Depends(get_db), current=Depends(require_super_admin)):
    branch = Branch(branch_code=req.branch_code, branch_name=req.branch_name, department=req.department)
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


# --- SUBJECTS ---
@router.get("/subjects", response_model=List[SubjectOut])
def get_subjects(branch_id: str = None, year: int = None, semester: int = None, db: Session = Depends(get_db), current=Depends(get_current_user)):
    query = db.query(Subject)
    if branch_id:
        query = query.filter(Subject.branch_id == branch_id)
    if year:
        query = query.filter(Subject.year == year)
    if semester:
        query = query.filter(Subject.semester == semester)
    return query.all()


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(req: SubjectCreate, db: Session = Depends(get_db), current=Depends(require_super_admin)):
    subj = Subject(
        subject_code=req.subject_code,
        subject_name=req.subject_name,
        branch_id=req.branch_id,
        year=req.year,
        semester=req.semester,
        credits=req.credits,
    )
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj


# --- CLASSROOMS ---
@router.get("/classrooms", response_model=List[ClassroomOut])
def get_classrooms(db: Session = Depends(get_db), current=Depends(get_current_user)):
    return db.query(Classroom).all()


@router.post("/classrooms", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
def create_classroom(req: ClassroomCreate, db: Session = Depends(get_db), current=Depends(require_super_admin)):
    secret_hash = get_password_hash(req.scanner_secret) if req.scanner_secret else None
    room = Classroom(
        room_code=req.room_code,
        room_name=req.room_name,
        building=req.building,
        scanner_id=req.scanner_id,
        scanner_secret_hash=secret_hash,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


# --- ENROLLMENTS ---
@router.get("/enrollments", response_model=List[EnrollmentOut])
def get_enrollments(student_id: str = None, db: Session = Depends(get_db), current=Depends(get_current_user)):
    query = db.query(Enrollment)
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    return query.all()


@router.post("/enrollments", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
def create_enrollment(req: EnrollmentCreate, db: Session = Depends(get_db), current=Depends(require_super_admin)):
    enr = Enrollment(
        student_id=req.student_id,
        branch_id=req.branch_id,
        year=req.year,
        semester=req.semester,
        section=req.section,
        academic_year=req.academic_year,
    )
    db.add(enr)
    db.commit()
    db.refresh(enr)
    return enr
