from datetime import datetime, timezone, timedelta, time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import Attendance, AttendanceEvent, ClassSession, Student, Enrollment, AuditLog


class AttendanceService:
    @staticmethod
    def calculate_attendance_status(
        session_start: datetime,
        session_end: datetime,
        entry_time: datetime,
        exit_time: Optional[datetime],
        allowed_late_minutes: int = 10,
        minimum_duration_minutes: int = 60,
    ) -> str:
        if not exit_time:
            return "exit_missing"

        entry_deadline = session_start + timedelta(minutes=allowed_late_minutes)
        duration_minutes = int((exit_time - entry_time).total_seconds() / 60)

        if duration_minutes < minimum_duration_minutes:
            return "insufficient_duration"

        if entry_time <= entry_deadline:
            return "present"
        else:
            return "late"

    @staticmethod
    def record_entry(
        db: Session,
        class_session: ClassSession,
        student: Student,
        scanner_id: str,
        qr_verified: bool,
        face_verified: bool,
        face_confidence: float,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)

        existing = (
            db.query(Attendance)
            .filter(
                Attendance.class_session_id == class_session.id,
                Attendance.student_id == student.id,
            )
            .first()
        )

        if existing and existing.entry_time is not None:
            return {
                "success": False,
                "status_code": "ALREADY_ENTERED",
                "message": "Entry already recorded for this class session.",
                "attendance": existing,
            }

        if not existing:
            attendance = Attendance(
                class_session_id=class_session.id,
                student_id=student.id,
                entry_time=now,
                qr_verified=qr_verified,
                face_verified=face_verified,
                face_confidence=face_confidence,
                status="pending",
            )
            db.add(attendance)
        else:
            attendance = existing
            attendance.entry_time = now
            attendance.qr_verified = qr_verified
            attendance.face_verified = face_verified
            attendance.face_confidence = face_confidence
            attendance.status = "pending"

        event = AttendanceEvent(
            class_session_id=class_session.id,
            student_id=student.id,
            event_type="ENTRY_RECORDED",
            event_time=now,
            scanner_id=scanner_id,
            metadata_info={
                "qr_verified": qr_verified,
                "face_verified": face_verified,
                "face_confidence": face_confidence,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(attendance)

        return {
            "success": True,
            "status_code": "ENTRY_RECORDED",
            "message": "Entry recorded successfully.",
            "attendance": attendance,
        }

    @staticmethod
    def record_exit(
        db: Session,
        class_session: ClassSession,
        student: Student,
        scanner_id: str,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)

        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.class_session_id == class_session.id,
                Attendance.student_id == student.id,
            )
            .first()
        )

        if not attendance or not attendance.entry_time:
            return {
                "success": False,
                "status_code": "EXIT_WITHOUT_ENTRY",
                "message": "Cannot record exit without prior entry scan.",
            }

        if attendance.exit_time is not None:
            return {
                "success": False,
                "status_code": "ALREADY_EXITED",
                "message": "Exit already recorded for this session.",
                "attendance": attendance,
            }

        attendance.exit_time = now
        entry_time = attendance.entry_time

        if entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)

        duration = int((now - entry_time).total_seconds() / 60)
        attendance.duration_minutes = duration

        s_date = class_session.class_date
        s_start = datetime.combine(s_date, class_session.start_time).replace(tzinfo=timezone.utc)
        s_end = datetime.combine(s_date, class_session.end_time).replace(tzinfo=timezone.utc)

        final_status = AttendanceService.calculate_attendance_status(
            session_start=s_start,
            session_end=s_end,
            entry_time=entry_time,
            exit_time=now,
            allowed_late_minutes=class_session.allowed_late_minutes,
            minimum_duration_minutes=class_session.minimum_duration_minutes,
        )

        attendance.status = final_status

        event = AttendanceEvent(
            class_session_id=class_session.id,
            student_id=student.id,
            event_type="EXIT_RECORDED",
            event_time=now,
            scanner_id=scanner_id,
            metadata_info={
                "duration_minutes": duration,
                "calculated_status": final_status,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(attendance)

        return {
            "success": True,
            "status_code": "EXIT_RECORDED",
            "message": "Exit recorded successfully.",
            "duration_minutes": duration,
            "attendance_status": final_status.upper(),
            "attendance": attendance,
        }

    @staticmethod
    def manual_override(
        db: Session,
        class_session_id: str,
        student_id: str,
        new_status: str,
        reason: str,
        performed_by_id: str,
        performed_by_role: str,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)

        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.class_session_id == class_session_id,
                Attendance.student_id == student_id,
            )
            .first()
        )

        old_status = attendance.status if attendance else "absent"

        if not attendance:
            attendance = Attendance(
                class_session_id=class_session_id,
                student_id=student_id,
                status=new_status,
            )
            db.add(attendance)
        else:
            attendance.status = new_status

        event = AttendanceEvent(
            class_session_id=class_session_id,
            student_id=student_id,
            event_type="FACULTY_OVERRIDE",
            event_time=now,
            performed_by=performed_by_id,
            metadata_info={
                "old_status": old_status,
                "new_status": new_status,
                "reason": reason,
                "role": performed_by_role,
            },
        )
        db.add(event)

        audit = AuditLog(
            user_id=performed_by_id,
            role=performed_by_role,
            action="MANUAL_ATTENDANCE_OVERRIDE",
            entity_type="attendance",
            entity_id=attendance.id,
            old_data={"status": old_status},
            new_data={"status": new_status, "reason": reason},
        )
        db.add(audit)
        db.commit()
        db.refresh(attendance)

        return {
            "success": True,
            "message": f"Attendance override to {new_status} logged successfully.",
            "attendance": attendance,
        }

    @staticmethod
    def get_virtual_spreadsheet_data(db: Session, class_session_id: str) -> Dict[str, Any]:
        session = db.query(ClassSession).filter(ClassSession.id == class_session_id).first()
        if not session:
            return {
                "session_id": class_session_id,
                "session": {},
                "stats": {"present": 0, "late": 0, "absent": 0},
                "summary": {"present": 0, "late": 0, "absent": 0},
                "students": [],
            }

        students = (
            db.query(Student)
            .filter(
                Student.branch_id == session.branch_id,
                Student.year == session.year,
                Student.semester == session.semester,
            )
            .all()
        )

        if not students:
            students = db.query(Student).all()

        attendances = (
            db.query(Attendance)
            .filter(Attendance.class_session_id == class_session_id)
            .all()
        )
        att_map = {att.student_id: att for att in attendances}

        rows = []
        present_cnt = 0
        late_cnt = 0
        absent_cnt = 0

        for st in students:
            att = att_map.get(st.id)
            if att:
                status_str = (att.status or "ABSENT").upper()
                if status_str in ["PRESENT", "MANUAL_PRESENT"]:
                    present_cnt += 1
                elif status_str == "LATE":
                    late_cnt += 1
                else:
                    absent_cnt += 1

                rows.append({
                    "student_id": st.id,
                    "roll_no": st.roll_no,
                    "name": st.name,
                    "phone": st.phone,
                    "email": st.email,
                    "section": st.section,
                    "entry_time": att.entry_time.strftime("%H:%M:%S") if att.entry_time else None,
                    "exit_time": att.exit_time.strftime("%H:%M:%S") if att.exit_time else None,
                    "duration_minutes": att.duration_minutes,
                    "qr_verified": att.qr_verified,
                    "face_verified": att.face_verified,
                    "face_confidence": att.face_confidence,
                    "status": status_str,
                })
            else:
                absent_cnt += 1
                rows.append({
                    "student_id": st.id,
                    "roll_no": st.roll_no,
                    "name": st.name,
                    "phone": st.phone,
                    "email": st.email,
                    "section": st.section,
                    "entry_time": None,
                    "exit_time": None,
                    "duration_minutes": 0,
                    "qr_verified": False,
                    "face_verified": False,
                    "face_confidence": 0.0,
                    "status": "ABSENT",
                })

        subj_code = session.subject.subject_code if session.subject else "COURSE"
        subj_name = session.subject.subject_name if session.subject else "Class Session"

        stats_dict = {
            "present": present_cnt,
            "late": late_cnt,
            "absent": absent_cnt,
        }

        session_dict = {
            "id": session.id,
            "subject_code": subj_code,
            "subject_name": subj_name,
            "class_date": str(session.class_date),
            "start_time": str(session.start_time),
            "end_time": str(session.end_time),
            "section": session.section,
        }

        return {
            "session_id": session.id,
            "session": session_dict,
            "subject_code": subj_code,
            "subject_name": subj_name,
            "class_date": str(session.class_date),
            "start_time": str(session.start_time),
            "end_time": str(session.end_time),
            "total_students": len(students),
            "stats": stats_dict,
            "summary": stats_dict,
            "students": rows,
        }


attendance_service = AttendanceService()
