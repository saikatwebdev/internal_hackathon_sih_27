from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import require_super_admin, get_current_user
from app.schemas.user import StudentCreate, StudentUpdate, StudentOut, FacultyCreate, FacultyUpdate, FacultyOut
from app.database.models import Student, Faculty, Enrollment, AuditLog

router = APIRouter(prefix="/users", tags=["User Management"])


# --- STUDENT ENDPOINTS ---
@router.get("/students", response_model=List[StudentOut])
def list_students(
    branch_id: Optional[str] = None,
    year: Optional[int] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    query = db.query(Student)
    if branch_id:
        query = query.filter(Student.branch_id == branch_id)
    if year:
        query = query.filter(Student.year == year)
    if section:
        query = query.filter(Student.section == section)
    return query.order_by(Student.roll_no.asc()).all()


@router.post("/students", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreate,
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    existing = db.query(Student).filter((Student.roll_no == req.roll_no) | (Student.phone == req.phone)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this Roll No or Phone already exists")

    student = Student(
        roll_no=req.roll_no,
        name=req.name,
        phone=req.phone,
        email=req.email,
        password_hash=get_password_hash(req.password),
        branch_id=req.branch_id,
        year=req.year,
        semester=req.semester,
        section=req.section,
        face_reference_id=req.face_reference_id or f"FACE_{req.roll_no}",
        face_registered=True if req.face_reference_id else False,
    )
    db.add(student)
    db.flush()

    # Automatically create enrollment record
    enrollment = Enrollment(
        student_id=student.id,
        branch_id=req.branch_id,
        year=req.year,
        semester=req.semester,
        section=req.section,
        academic_year="2025-2026",
    )
    db.add(enrollment)

    audit = AuditLog(
        user_id=current["user_id"],
        role="super_admin",
        action="CREATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        new_data={"roll_no": student.roll_no, "name": student.name},
    )
    db.add(audit)
    db.commit()
    db.refresh(student)
    return student


@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(
    student_id: str,
    req: StudentUpdate,
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    old_data = {"name": student.name, "status": student.status}
    if req.password is not None and req.password.strip():
        student.password_hash = get_password_hash(req.password.strip())
    if req.roll_no is not None:
        student.roll_no = req.roll_no
    if req.name is not None:
        student.name = req.name
    if req.phone is not None:
        student.phone = req.phone
    if req.email is not None:
        student.email = req.email
    if req.branch_id is not None:
        student.branch_id = req.branch_id
    if req.year is not None:
        student.year = req.year
    if req.semester is not None:
        student.semester = req.semester
    if req.section is not None:
        student.section = req.section
    if req.face_reference_id is not None:
        student.face_reference_id = req.face_reference_id
        student.face_registered = True
    if req.status is not None:
        student.status = req.status

    audit = AuditLog(
        user_id=current["user_id"],
        role="super_admin",
        action="UPDATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        old_data=old_data,
        new_data={"name": student.name, "status": student.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), current=Depends(require_super_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.status = "deactivated"
    db.commit()
    return {"message": "Student deactivated successfully"}


# --- FACULTY ENDPOINTS ---
@router.get("/faculty", response_model=List[FacultyOut])
def list_faculty(db: Session = Depends(get_db), current=Depends(get_current_user)):
    return db.query(Faculty).order_by(Faculty.name.asc()).all()


@router.post("/faculty", response_model=FacultyOut, status_code=status.HTTP_201_CREATED)
def create_faculty(
    req: FacultyCreate,
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    existing = db.query(Faculty).filter((Faculty.employee_id == req.employee_id) | (Faculty.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty with this Employee ID or Email already exists")

    fac = Faculty(
        employee_id=req.employee_id,
        name=req.name,
        phone=req.phone,
        email=req.email,
        password_hash=get_password_hash(req.password),
        department=req.department,
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac


@router.put("/faculty/{faculty_id}", response_model=FacultyOut)
def update_faculty(
    faculty_id: str,
    req: FacultyUpdate,
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    if req.password is not None and req.password.strip():
        fac.password_hash = get_password_hash(req.password.strip())
    if req.name is not None:
        fac.name = req.name
    if req.phone is not None:
        fac.phone = req.phone
    if req.email is not None:
        fac.email = req.email
    if req.department is not None:
        fac.department = req.department
    if req.status is not None:
        fac.status = req.status

    db.commit()
    db.refresh(fac)
    return fac
