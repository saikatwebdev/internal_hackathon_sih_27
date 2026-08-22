from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class EntryRequest(BaseModel):
    qr_token: str
    roll: str
    subject_code: str
    date: str  # dd-mm-yyyy or YYYY-MM-DD
    face_image: str  # Base64 string or reference
    scanner_id: str


class EntryResponse(BaseModel):
    success: bool
    status: str
    student: Dict[str, Any]
    class_info: Dict[str, Any] = Field(..., alias="class")
    entry_time: str
    face_verified: bool

    class Config:
        populate_by_name = True


class ExitRequest(BaseModel):
    qr_token: Optional[str] = None
    roll: str
    scanner_id: str
    session_id: Optional[str] = None


class ExitResponse(BaseModel):
    success: bool
    status: str
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    attendance_status: str


class ManualOverrideRequest(BaseModel):
    student_id: str
    status: str  # present, absent, late, manual_present, manual_absent
    reason: str = Field(..., min_length=3, description="Reason is mandatory for manual corrections")


class AttendanceRecordOut(BaseModel):
    id: str
    class_session_id: str
    student_id: str
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    qr_verified: bool
    face_verified: bool
    face_confidence: Optional[float] = None
    status: str

    class Config:
        from_attributes = True
