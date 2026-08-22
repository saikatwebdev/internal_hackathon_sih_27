from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    # Accepts phone number (student) or email/employee_id (faculty/admin/scanner)
    username: str = Field(..., description="Phone number, Email, Employee ID, or Scanner ID")
    password: str = Field(..., description="User password or Scanner secret")
    role: str = Field(..., description="Role: 'student', 'faculty', 'super_admin', or 'scanner'")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
