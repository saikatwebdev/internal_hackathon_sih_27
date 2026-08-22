import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    branch_code = Column(String(50), unique=True, nullable=False, index=True)
    branch_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    students = relationship("Student", back_populates="branch", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="branch", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="branch", cascade="all, delete-orphan")
    class_sessions = relationship("ClassSession", back_populates="branch", cascade="all, delete-orphan")
