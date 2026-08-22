from typing import Dict, Any, List
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_super_admin, require_faculty, require_student
from app.database.models import Student, Faculty, Branch, Subject, ClassSession, Attendance, Enrollment, Classroom

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboards"])


@router.get("/admin")
def get_admin_dashboard_kpis(
    db: Session = Depends(get_db),
    current=Depends(require_super_admin),
):
    total_students = db.query(Student).filter(Student.status == "active").count()
    total_faculty = db.query(Faculty).filter(Faculty.status == "active").count()
    total_branches = db.query(Branch).count()
    total_subjects = db.query(Subject).count()
    total_classrooms = db.query(Classroom).count()

    today = date.today()
    todays_classes = db.query(ClassSession).filter(ClassSession.class_date == today).count()
    active_classes = db.query(ClassSession).filter(ClassSession.class_date == today, ClassSession.status == "active").count()

    # Today's attendance calculation
    today_sessions = db.query(ClassSession.id).filter(ClassSession.class_date == today).all()
    today_session_ids = [s.id for s in today_sessions]

    if today_session_ids:
        today_att = db.query(Attendance).filter(Attendance.class_session_id.in_(today_session_ids)).all()
        present_count = sum(1 for a in today_att if a.status and "present" in a.status.lower())
        total_records = len(today_att)
        today_attendance_pct = round((present_count / total_records * 100), 1) if total_records > 0 else 0
    else:
        today_attendance_pct = 0

    # Low attendance students count (< 75%)
    # Simple query check over enrollments/attendance
    low_attendance_students = []
    students = db.query(Student).filter(Student.status == "active").limit(50).all()
    for st in students:
        total_att = db.query(Attendance).filter(Attendance.student_id == st.id).count()
        if total_att > 0:
            pres = db.query(Attendance).filter(Attendance.student_id == st.id, Attendance.status.ilike("%present%")).count()
            pct = (pres / total_att) * 100
            if pct < 75.0:
                low_attendance_students.append({
                    "id": st.id,
                    "roll_no": st.roll_no,
                    "name": st.name,
                    "phone": st.phone,
                    "attendance_percentage": round(pct, 1),
                })

    return {
        "kpis": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_branches": total_branches,
            "total_subjects": total_subjects,
            "total_classrooms": total_classrooms,
            "todays_classes": todays_classes,
            "active_classes": active_classes,
            "today_attendance_pct": today_attendance_pct,
            "low_attendance_count": len(low_attendance_students),
        },
        "low_attendance_students": low_attendance_students[:10],
    }


@router.get("/faculty")
def get_faculty_dashboard(
    db: Session = Depends(get_db),
    current=Depends(require_faculty),
):
    fac_id = current["user_id"]
    sessions = db.query(ClassSession).filter(ClassSession.faculty_id == fac_id).all()
    total_sessions = len(sessions)

    session_ids = [s.id for s in sessions]
    if session_ids:
        attendances = db.query(Attendance).filter(Attendance.class_session_id.in_(session_ids)).all()
        total_scans = len(attendances)
        present_scans = sum(1 for a in attendances if a.status and "present" in a.status.lower())
        avg_attendance_pct = round((present_scans / total_scans * 100), 1) if total_scans > 0 else 0
    else:
        avg_attendance_pct = 0

    today = date.today()
    todays_classes = [
        {
            "id": s.id,
            "subject_code": s.subject.subject_code if s.subject else "",
            "subject_name": s.subject.subject_name if s.subject else "",
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "section": s.section,
            "room_code": s.classroom.room_code if s.classroom else "",
            "status": s.status,
        }
        for s in sessions if s.class_date == today
    ]

    return {
        "kpis": {
            "total_assigned_classes": total_sessions,
            "average_attendance_pct": avg_attendance_pct,
            "todays_class_count": len(todays_classes),
        },
        "todays_classes": todays_classes,
    }


@router.get("/student")
def get_student_dashboard(
    db: Session = Depends(get_db),
    current=Depends(require_student),
):
    student = current["user"]
    stud_id = student.id

    # Enrolled class sessions matching student section
    sessions = (
        db.query(ClassSession)
        .filter(
            ClassSession.branch_id == student.branch_id,
            ClassSession.year == student.year,
            ClassSession.semester == student.semester,
            ClassSession.section == student.section,
        )
        .all()
    )

    attendances = db.query(Attendance).filter(Attendance.student_id == stud_id).all()
    att_map = {a.class_session_id: a for a in attendances}

    subject_stats = {}
    total_attended = 0
    total_completed_classes = 0

    for s in sessions:
        subj_code = s.subject.subject_code if s.subject else "UNKNOWN"
        subj_name = s.subject.subject_name if s.subject else "Subject"

        if subj_code not in subject_stats:
            subject_stats[subj_code] = {
                "subject_code": subj_code,
                "subject_name": subj_name,
                "attended": 0,
                "total": 0,
                "percentage": 0,
            }

        if s.status == "completed" or (s.class_date <= date.today() and s.status != "cancelled"):
            subject_stats[subj_code]["total"] += 1
            total_completed_classes += 1

            att = att_map.get(s.id)
            if att and att.status and "present" in att.status.lower():
                subject_stats[subj_code]["attended"] += 1
                total_attended += 1

    subject_list = []
    for code, data in subject_stats.items():
        tot = data["total"]
        att_cnt = data["attended"]
        pct = round((att_cnt / tot * 100), 1) if tot > 0 else 100.0
        data["percentage"] = pct
        data["is_low_attendance"] = pct < 75.0
        subject_list.append(data)

    overall_pct = round((total_attended / total_completed_classes * 100), 1) if total_completed_classes > 0 else 100.0

    today = date.today()
    todays_classes = [
        {
            "id": s.id,
            "subject_code": s.subject.subject_code if s.subject else "",
            "subject_name": s.subject.subject_name if s.subject else "",
            "faculty_name": s.faculty.name if s.faculty else "",
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "room_code": s.classroom.room_code if s.classroom else "",
            "status": s.status,
            "my_status": (
                att_map[s.id].status.upper()
                if s.id in att_map and att_map[s.id].status
                else "NOT_SCANNED"
            ),
        }
        for s in sessions if s.class_date == today
    ]

    return {
        "kpis": {
            "overall_attendance_pct": overall_pct,
            "total_attended": total_attended,
            "total_completed_classes": total_completed_classes,
            "classes_missed": total_completed_classes - total_attended,
            "is_low_attendance": overall_pct < 75.0,
        },
        "subject_breakdown": subject_list,
        "todays_classes": todays_classes,
    }
