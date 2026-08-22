from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class BranchCreate(BaseModel):
    branch_code: str
    branch_name: str
    department: Optional[str] = None


class BranchOut(BaseModel):
    id: str
    branch_code: str
    branch_name: str
    department: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: str
    branch_id: str
    year: int
    semester: int
    credits: int = 3


class SubjectOut(BaseModel):
    id: str
    subject_code: str
    subject_name: str
    branch_id: str
    year: int
    semester: int
    credits: int
    status: str

    class Config:
        from_attributes = True


class ClassroomCreate(BaseModel):
    room_code: str
    room_name: Optional[str] = None
    building: Optional[str] = None
    scanner_id: str
    scanner_secret: Optional[str] = "scanner123"


class ClassroomOut(BaseModel):
    id: str
    room_code: str
    room_name: Optional[str] = None
    building: Optional[str] = None
    scanner_id: str
    status: str

    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    student_id: str
    branch_id: str
    year: int
    semester: int
    section: str
    academic_year: str = "2025-2026"


class EnrollmentOut(BaseModel):
    id: str
    student_id: str
    branch_id: str
    year: int
    semester: int
    section: str
    academic_year: str
    status: str

    class Config:
        from_attributes = True
