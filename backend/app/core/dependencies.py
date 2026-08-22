from typing import Generator, Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import decode_token
from app.database.models import Student, Faculty, SuperAdmin, Classroom

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user_payload(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload


def get_current_user(
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    user_id = payload.get("sub")
    role = payload.get("role")

    if role == "super_admin":
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
    elif role == "faculty":
        user = db.query(Faculty).filter(Faculty.id == user_id).first()
    elif role == "student":
        user = db.query(Student).filter(Student.id == user_id).first()
    elif role == "scanner":
        user = db.query(Classroom).filter(Classroom.id == user_id).first()
    else:
        user = None

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"user": user, "role": role, "user_id": user_id, "payload": payload}


def require_role(allowed_roles: list[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user['role']}'",
            )
        return current_user

    return role_checker


require_super_admin = require_role(["super_admin"])
require_faculty = require_role(["faculty", "super_admin"])
require_student = require_role(["student", "super_admin"])
require_faculty_only = require_role(["faculty"])
require_student_only = require_role(["student"])
require_scanner = require_role(["scanner", "super_admin", "faculty"])
