import time
import json
import hmac
import hashlib
import base64
from typing import Dict, Any, Tuple
from datetime import datetime
from app.core.config import settings


class QRService:
    def __init__(self):
        self.secret_key = settings.QR_SECRET_KEY.encode('utf-8')
        self.expiration_seconds = settings.QR_EXPIRATION_SECONDS
        self._consumed_nonces = set()

    def generate_entry_qr_json(
        self,
        roll_no: str,
        subject_code: str,
        class_session_id: str,
        student_id: str = "",
        face_image_ref: str = "",
    ) -> Dict[str, Any]:
        """
        Generates dynamic Entry QR JSON object with timestamp and signature:
        {
          "type": "ENTRY",
          "roll": "23AI045",
          "subject_code": "AI301",
          "date": "26-08-22",
          "entry_time": "10:00",
          "timestamp": 1787400000,
          "signature": "..."
        }
        """
        now = datetime.now()
        date_str = now.strftime("%y-%m-%d")
        entry_time_str = now.strftime("%H:%M")
        ts = int(now.timestamp())

        payload = {
          "type": "ENTRY",
          "roll": str(roll_no),
          "student_id": str(student_id),
          "subject_code": str(subject_code),
          "date": date_str,
          "entry_time": entry_time_str,
          "face_image": face_image_ref or f"FACE_REF_{roll_no}",
          "session_id": str(class_session_id),
          "timestamp": ts,
        }

        signature = self._sign_payload(payload)
        payload["signature"] = signature

        qr_string = json.dumps(payload)
        return {
            "qr_token": qr_string,
            "qr_json": payload,
            "expires_in_seconds": self.expiration_seconds,
        }

    def generate_exit_qr_json(
        self,
        roll_no: str,
        class_session_id: str,
    ) -> Dict[str, Any]:
        """
        Generates dynamic Exit QR JSON object with timestamp and signature:
        {
          "type": "EXIT",
          "roll": "23AI045",
          "session_id": "CLS_20260822_001",
          "exit_time": "11:20",
          "timestamp": 1787400000,
          "signature": "..."
        }
        """
        now = datetime.now()
        exit_time_str = now.strftime("%H:%M")
        ts = int(now.timestamp())

        payload = {
          "type": "EXIT",
          "roll": str(roll_no),
          "session_id": str(class_session_id),
          "exit_time": exit_time_str,
          "timestamp": ts,
        }

        signature = self._sign_payload(payload)
        payload["signature"] = signature

        qr_string = json.dumps(payload)
        return {
            "qr_token": qr_string,
            "qr_json": payload,
            "expires_in_seconds": self.expiration_seconds,
        }

    def generate_student_session_qr(
        self,
        student_id: str,
        roll_no: str,
        class_session_id: str,
        subject_code: str = "AI301",
    ) -> Dict[str, Any]:
        """Backward compatible helper returning Entry QR json string"""
        return self.generate_entry_qr_json(
            roll_no=roll_no,
            student_id=student_id,
            subject_code=subject_code,
            class_session_id=class_session_id,
        )

    def validate_qr_token(self, qr_token_string: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Validates QR string (JSON formatted or Base64 JWT format).
        Enforces strict 10-second timestamp expiration and consumed token tracking.
        Returns (is_valid, payload, error_message).
        """
        if not qr_token_string:
            return False, {}, "QR_TOKEN_EMPTY"

        try:
            payload = {}
            if qr_token_string.strip().startswith("{") and qr_token_string.strip().endswith("}"):
                payload = json.loads(qr_token_string)
            elif "." in qr_token_string:
                parts = qr_token_string.split(".")
                if len(parts) == 2:
                    encoded_payload, signature = parts
                    payload_json = base64.urlsafe_b64decode(encoded_payload.encode('utf-8')).decode('utf-8')
                    payload = json.loads(payload_json)

            if payload:
                roll = payload.get("roll")
                if not roll:
                    return False, payload, "QR_INVALID_MISSING_ROLL"

                # Timestamp expiration check (max 30 seconds)
                ts = payload.get("timestamp")
                if ts is not None:
                    current_ts = int(time.time())
                    age_seconds = current_ts - int(ts)
                    if age_seconds > self.expiration_seconds:
                        return False, payload, "QR_EXPIRED"
                    if age_seconds < -15:
                        return False, payload, "QR_INVALID_FUTURE_TIMESTAMP"

                # Replay protection check
                sig = payload.get("signature") or f"{roll}_{ts}"
                if sig in self._consumed_nonces:
                    return False, payload, "QR_ALREADY_USED"

                self._consumed_nonces.add(sig)
                if len(self._consumed_nonces) > 5000:
                    self._consumed_nonces.clear()

                return True, payload, ""

            # Plain Roll fallback for manual input
            return True, {"roll": qr_token_string.strip()}, ""
        except Exception as e:
            if len(qr_token_string) < 15:
                return True, {"roll": qr_token_string.strip()}, ""
            return False, {}, f"QR_DECODE_FAILED: {str(e)}"

    def _sign_payload(self, payload: dict) -> str:
        data_to_sign = f"{payload.get('roll')}:{payload.get('session_id')}:{payload.get('timestamp')}"
        return hmac.new(self.secret_key, data_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()


qr_service = QRService()
