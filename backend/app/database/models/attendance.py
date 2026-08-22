import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_session_id = Column(String(36), ForeignKey("class_sessions.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False, index=True)

    entry_time = Column(DateTime(timezone=True), nullable=True)
    exit_time = Column(DateTime(timezone=True), nullable=True)

    duration_minutes = Column(Integer, nullable=True)

    qr_verified = Column(Boolean, default=False)
    face_verified = Column(Boolean, default=False)
    face_confidence = Column(Float, nullable=True)

    status = Column(String(30), default="pending", index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    class_session = relationship("ClassSession", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("class_session_id", "student_id", name="uq_session_student_attendance"),
    )


class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_session_id = Column(String(36), ForeignKey("class_sessions.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False, index=True)

    event_type = Column(String(50), nullable=False)
    event_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    scanner_id = Column(String(100), nullable=True)
    performed_by = Column(String(36), nullable=True)

    metadata_info = Column("metadata", JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    class_session = relationship("ClassSession", back_populates="attendance_events")
    student = relationship("Student", back_populates="attendance_events")
