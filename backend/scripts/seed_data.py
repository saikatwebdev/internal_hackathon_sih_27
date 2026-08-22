import sys
import os

# Add backend root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.database.models import SuperAdmin, Classroom


def seed():
    print("Recreating clean database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding Super Admin...")
        admin = SuperAdmin(
            name="System Administrator",
            email="admin@college.edu",
            phone="9999999999",
            password_hash=get_password_hash("admin123"),
        )
        db.add(admin)

        print("Seeding Classroom Kiosk...")
        room = Classroom(
            room_code="LAB-204",
            room_name="Classroom Kiosk Lab",
            building="Tech Block A",
            scanner_id="LAB204_SCANNER",
            scanner_secret_hash=get_password_hash("scanner123"),
        )
        db.add(room)

        db.commit()
        print("Clean Database initialized successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
