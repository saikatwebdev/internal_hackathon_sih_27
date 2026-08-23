from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class StudentCreate(BaseModel):
    roll_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=3)
    branch_id: str
    year: int
    semester: int
    section: str
    face_reference_id: Optional[str] = None

    @field_validator("email", "phone", "face_reference_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StudentUpdate(BaseModel):
    roll_no: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=3, description="Set/Reset user password")
    branch_id: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    face_reference_id: Optional[str] = None
    status: Optional[str] = None

    @field_validator("email", "phone", "face_reference_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StudentOut(BaseModel):
    id: str
    roll_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    branch_id: str
    year: int
    semester: int
    section: str
    face_registered: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FacultyCreate(BaseModel):
    employee_id: str
    name: str
    phone: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=3)
    department: Optional[str] = None

    @field_validator("phone", "department", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=3, description="Set/Reset user password")
    department: Optional[str] = None
    status: Optional[str] = None

    @field_validator("email", "phone", "department", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class FacultyOut(BaseModel):
    id: str
    employee_id: str
    name: str
    phone: Optional[str] = None
    email: str
    department: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SuperAdminOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)
