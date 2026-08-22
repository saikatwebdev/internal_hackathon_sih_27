from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, ChangePasswordRequest
from app.database.models import Student, Faculty, SuperAdmin, Classroom

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = None
    user_id = None
    role = req.role.lower()
    user_dict = {}

    clean_username = req.username.strip() if req.username else ""
    clean_password = req.password.strip() if req.password else ""

    if role == "student":
        # Can login using Roll No, Email, or Phone (case-insensitive)
        user = (
            db.query(Student)
            .filter(
                (func.lower(Student.roll_no) == clean_username.lower())
                | (func.lower(Student.email) == clean_username.lower())
                | (Student.phone == clean_username)
            )
            .first()
        )
        if user and verify_password(clean_password, user.password_hash):
            user_id = user.id
            user_dict = {
                "id": user.id,
                "roll_no": user.roll_no,
                "name": user.name,
                "role": "student",
                "branch_id": user.branch_id,
                "year": user.year,
                "semester": user.semester,
                "section": user.section,
            }
    elif role == "faculty":
        # Can login using Email, Employee ID, or Phone (case-insensitive)
        user = (
            db.query(Faculty)
            .filter(
                (func.lower(Faculty.email) == clean_username.lower())
                | (func.lower(Faculty.employee_id) == clean_username.lower())
                | (Faculty.phone == clean_username)
            )
            .first()
        )
        if user and verify_password(clean_password, user.password_hash):
            user_id = user.id
            user_dict = {
                "id": user.id,
                "employee_id": user.employee_id,
                "name": user.name,
                "email": user.email,
                "role": "faculty",
                "department": user.department,
            }
    elif role == "super_admin":
        user = (
            db.query(SuperAdmin)
            .filter(func.lower(SuperAdmin.email) == clean_username.lower())
            .first()
        )
        if user and verify_password(clean_password, user.password_hash):
            user_id = user.id
            user_dict = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": "super_admin",
            }
    elif role == "scanner":
        user = (
            db.query(Classroom)
            .filter(func.lower(Classroom.scanner_id) == clean_username.lower())
            .first()
        )
        if user:
            if not user.scanner_secret_hash or verify_password(clean_password, user.scanner_secret_hash):
                user_id = user.id
                user_dict = {
                    "id": user.id,
                    "scanner_id": user.scanner_id,
                    "room_code": user.room_code,
                    "room_name": user.room_name,
                    "role": "scanner",
                }

    if not user or not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or role mismatch. Please check your username/email and password.",
        )

    access_token = create_access_token(subject=user_id, role=role, extra_claims={"name": user_dict.get("name")})
    refresh_token = create_refresh_token(subject=user_id, role=role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_dict,
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    role = payload.get("role")

    access_token = create_access_token(subject=user_id, role=role)
    new_refresh = create_refresh_token(subject=user_id, role=role)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": {"id": user_id, "role": role},
    }


@router.get("/me")
def get_me(current=Depends(get_current_user)):
    user = current["user"]
    role = current["role"]

    if role == "student":
        return {
            "id": user.id,
            "roll_no": user.roll_no,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": "student",
            "branch_id": user.branch_id,
            "year": user.year,
            "semester": user.semester,
            "section": user.section,
        }
    elif role == "faculty":
        return {
            "id": user.id,
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": "faculty",
            "department": user.department,
        }
    elif role == "super_admin":
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "super_admin",
        }
    elif role == "scanner":
        return {
            "id": user.id,
            "scanner_id": user.scanner_id,
            "room_code": user.room_code,
            "room_name": user.room_name,
            "role": "scanner",
        }


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), current=Depends(get_current_user)):
    user = current["user"]
    if not verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password")

    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
