import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(50), unique=True, nullable=False, index=True)
    subject_name = Column(String(100), nullable=False)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, default=3)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    branch = relationship("Branch", back_populates="subjects")
    class_sessions = relationship("ClassSession", back_populates="subject", cascade="all, delete-orphan")
