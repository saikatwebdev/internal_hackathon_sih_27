import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, Time, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    classroom_id = Column(String(36), ForeignKey("classrooms.id"), nullable=False, index=True)

    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), nullable=False)

    class_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    allowed_late_minutes = Column(Integer, default=10)
    minimum_duration_minutes = Column(Integer, default=60)

    status = Column(String(20), default="scheduled", index=True)  # scheduled, active, completed, cancelled

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    subject = relationship("Subject", back_populates="class_sessions")
    faculty = relationship("Faculty", back_populates="class_sessions")
    branch = relationship("Branch", back_populates="class_sessions")
    classroom = relationship("Classroom", back_populates="class_sessions")

    attendances = relationship("Attendance", back_populates="class_session", cascade="all, delete-orphan")
    attendance_events = relationship("AttendanceEvent", back_populates="class_session", cascade="all, delete-orphan")
    session_changes = relationship("ClassSessionChange", back_populates="class_session", cascade="all, delete-orphan")


class ClassSessionChange(Base):
    __tablename__ = "class_session_changes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_session_id = Column(String(36), ForeignKey("class_sessions.id"), nullable=False, index=True)
    changed_by = Column(String(36), nullable=False)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    class_session = relationship("ClassSession", back_populates="session_changes")
