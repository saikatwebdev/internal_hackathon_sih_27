# Smart Attendance Management System — Full-Stack College Platform

A production-ready, modular, and secure **Smart Attendance Management System** for colleges built with:

* **Backend:** FastAPI (Python), SQLAlchemy 2.0 ORM, Alembic, Pydantic v2, PyJWT, Argon2/Bcrypt, Pandas & OpenPyXL.
* **Frontend:** React.js (Vite), Axios, Tailwind CSS, Recharts, Lucide Icons.
* **Database:** PostgreSQL (with SQLite compatibility for fast unit testing & local execution).
* **Biometric Verification:** External Face Recognition API Integration (`face_service.py`) verifying student identity against validated 10-second signed QR tokens.

---

## 🌟 Key System Capabilities

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin**: Manage students, faculty, branches, subjects, classrooms, view global KPIs, low-attendance alerts (<75%), system settings, and immutable audit logs.
   - **Faculty**: Schedule classes with overlap/conflict validation, view live class sessions, access the **Virtual Attendance Spreadsheet View** (which LEFT JOINs all enrolled students), perform manual attendance corrections with mandatory reason logging, and export Excel (`.xlsx`) / CSV reports.
   - **Student**: View personalized class schedules, generate **10-second time-bound signed QR codes** (with live countdown progress bar), view subject-wise attendance percentages, and receive low-attendance warnings.
   - **Classroom Kiosk Scanner**: Full-screen tablet scanner UI tied to unique `scanner_id` credentials, providing real-time audio/visual feedback (`VERIFIED` vs `FACE MISMATCH` vs `SERVICE UNAVAILABLE`).

2. **Attendance Rule Engine (`attendance_service.py`)**:
   - `Allowed Entry Deadline = class_start + allowed_late_minutes`
   - `Duration = exit_time - entry_time`
   - `Valid Duration = duration >= minimum_duration_minutes`
   - Automated status assignment: `PRESENT`, `LATE`, `INSUFFICIENT_DURATION`, `EXIT_MISSING`, `ABSENT`, `MANUAL_PRESENT`, `MANUAL_ABSENT`.
   - Enrolled student population guarantee: Students who do not scan entry/exit are automatically rendered as `ABSENT` in spreadsheet views and exported reports.

3. **QR Code & Biometric Security**:
   - HMAC-SHA256 signed JWT QR tokens expiring in 10 seconds.
   - Server-side timestamp authority to prevent client device clock manipulation.
   - Replay protection with consumed nonce tracking.
   - Face verification strictly validates that the captured face matches the identity embedded in the QR token.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows: venv\Scripts\activate

# Install dependencies
python -m pip install -r requirements.txt

# Seed demonstration data
python scripts/seed_data.py

# Run FastAPI dev server
python -m uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 3. Backend Test Suite
```bash
cd backend
python -m pytest -v
```

### 4. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Run Vite dev server
npm run dev -- --port 3000
```
- App URL: `http://localhost:3000`

---

## 🔑 Pre-Loaded Demo Credentials

| Role | Username / Identifier | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@college.edu` | `admin123` | Full institution administration |
| **Faculty** | `prof.sharma@college.edu` | `faculty123` | Class scheduling, Live spreadsheet, Exports |
| **Student** | `23AI001` or `9800000001` | `student123` | Attendance QR generator, profile, alerts |
| **Classroom Kiosk** | `LAB204_SCANNER` | `scanner123` | Full-screen tablet scanner UI |

---

## 📂 Project Structure

```text
c:\Users\SHAKIT\Desktop\Academics\Internships\
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point & router setup
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic v2 settings & ENV loading
│   │   │   ├── security.py           # Password hashing, JWT & QR token signing
│   │   │   └── dependencies.py       # Auth & RBAC dependency injectors
│   │   ├── database/
│   │   │   ├── database.py           # SQLAlchemy 2.0 session maker
│   │   │   └── models/               # SQLAlchemy ORM models (Branch, User, Subject, Classroom, Session, Attendance, AuditLog)
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   ├── routers/                  # API endpoints (/auth, /users, /academic, /sessions, /attendance, /qr, /analytics, /reports)
│   │   ├── services/
│   │   │   ├── attendance_service.py # Attendance rule engine & state transitions
│   │   │   ├── qr_service.py         # 10s signed QR generator & validator
│   │   │   ├── face_service.py       # Render Face API integration service
│   │   │   └── report_service.py     # Excel & CSV matrix report generator
│   ├── scripts/
│   │   └── seed_data.py              # Demo database populator
│   ├── tests/                        # Automated Pytest suite
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axiosClient.js        # Axios instance with auto refresh token logic
    │   ├── context/AuthContext.jsx   # Global auth state & RBAC provider
    │   ├── components/
    │   │   ├── common/               # Sidebar, Navbar, StatusBadge, Card
    │   │   └── qr/                   # QRGeneratorModal (10s countdown), ClassroomScannerComponent
    │   ├── layouts/                  # AdminLayout, FacultyLayout, StudentLayout
    │   ├── pages/                    # Auth, Admin, Faculty, Student, and Scanner pages
    │   └── routes/AppRoutes.jsx      # Role-protected frontend routes
    ├── package.json
    └── vite.config.js
```
