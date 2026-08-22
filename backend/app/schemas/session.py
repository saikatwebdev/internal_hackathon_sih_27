from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel
from app.schemas.academic import SubjectOut, ClassroomOut, BranchOut
from app.schemas.user import FacultyOut


class SessionCreate(BaseModel):
    subject_id: str
    branch_id: str
    year: int
    semester: int
    section: str
    classroom_id: str
    class_date: date
    start_time: time
    end_time: time
    allowed_late_minutes: int = 10
    minimum_duration_minutes: int = 60


class SessionUpdate(BaseModel):
    class_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    classroom_id: Optional[str] = None
    allowed_late_minutes: Optional[int] = None
    minimum_duration_minutes: Optional[int] = None
    status: Optional[str] = None
    reason: Optional[str] = None


class SessionOut(BaseModel):
    id: str
    subject_id: str
    faculty_id: str
    branch_id: str
    classroom_id: str
    year: int
    semester: int
    section: str
    class_date: date
    start_time: time
    end_time: time
    allowed_late_minutes: int
    minimum_duration_minutes: int
    status: str
    created_at: datetime

    subject: Optional[SubjectOut] = None
    faculty: Optional[FacultyOut] = None
    classroom: Optional[ClassroomOut] = None
    branch: Optional[BranchOut] = None

    class Config:
        from_attributes = True
