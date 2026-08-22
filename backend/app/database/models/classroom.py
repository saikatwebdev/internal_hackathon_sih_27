import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_code = Column(String(50), unique=True, nullable=False, index=True)
    room_name = Column(String(100), nullable=True)
    building = Column(String(100), nullable=True)
    scanner_id = Column(String(100), unique=True, nullable=False, index=True)
    scanner_secret_hash = Column(String(255), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    class_sessions = relationship("ClassSession", back_populates="classroom", cascade="all, delete-orphan")
