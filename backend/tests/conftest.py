import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import Base and ALL models so metadata knows all tables
from app.database.database import Base, get_db
from app.database.models import (
    SuperAdmin, Faculty, Student, Branch, Subject, Classroom, Enrollment, ClassSession, Attendance, AttendanceEvent, AuditLog, Notification
)
from app.main import app
from app.core.security import get_password_hash
from datetime import date, time
from app.core.config import settings
settings.ENVIRONMENT = "testing"

# Use StaticPool so all threads/connections share the exact same in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seed_test_data(db_session):
    # Admin
    admin = SuperAdmin(
        name="Admin Test",
        email="admin@test.com",
        phone="9999999999",
        password_hash=get_password_hash("admin123"),
    )
    # Branch
    branch = Branch(branch_code="AIML", branch_name="AI & ML", department="CSE")
    db_session.add_all([admin, branch])
    db_session.flush()

    # Classroom
    room = Classroom(
        room_code="LAB-204",
        scanner_id="LAB204_SCANNER",
        scanner_secret_hash=get_password_hash("scanner123"),
    )
    db_session.add(room)
    db_session.flush()

    # Faculty
    fac = Faculty(
        employee_id="FAC001",
        name="Dr. Smith",
        phone="9876543210",
        email="smith@test.com",
        password_hash=get_password_hash("faculty123"),
        department="CSE",
    )
    db_session.add(fac)
    db_session.flush()

    # Subject
    subj = Subject(
        subject_code="AI301",
        subject_name="Machine Learning",
        branch_id=branch.id,
        year=2,
        semester=3,
    )
    db_session.add(subj)
    db_session.flush()

    # Student
    stud = Student(
        roll_no="23AI001",
        name="Test Student",
        phone="9800000001",
        email="student@test.com",
        password_hash=get_password_hash("student123"),
        branch_id=branch.id,
        year=2,
        semester=3,
        section="A",
        face_reference_id="FACE_23AI001",
    )
    db_session.add(stud)
    db_session.flush()

    enr = Enrollment(
        student_id=stud.id,
        branch_id=branch.id,
        year=2,
        semester=3,
        section="A",
    )
    db_session.add(enr)

    # Class Session
    sess = ClassSession(
        subject_id=subj.id,
        faculty_id=fac.id,
        branch_id=branch.id,
        classroom_id=room.id,
        year=2,
        semester=3,
        section="A",
        class_date=date.today(),
        start_time=time(10, 0),
        end_time=time(12, 0),
        status="active",
    )
    db_session.add(sess)
    db_session.commit()

    return {
        "admin": admin,
        "faculty": fac,
        "student": stud,
        "branch": branch,
        "classroom": room,
        "subject": subj,
        "session": sess,
    }
