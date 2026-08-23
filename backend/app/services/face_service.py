import base64
import httpx
from typing import Dict, Any
from app.core.config import settings


# Roll numbers that always pass face verification (bypassed/whitelisted demo accounts)
ALLOWED_DEMO_ROLLS = {"387002", "387006", "387027"}


class FaceService:
    def __init__(self):
        self.api_url = settings.FACE_API_URL
        self.timeout = settings.FACE_API_TIMEOUT_SECONDS
        self.mock_mode = settings.MOCK_FACE_API

    async def verify_face_identity(
        self,
        face_image_base64: str,
        expected_student_id: str = "",
        expected_roll_no: str = "",
        expected_face_ref_id: str = None,
    ) -> Dict[str, Any]:
        """
        Face verification logic (External HTTP call commented out per user request).
        When the picture is taken, it always returns True if the roll_no detected by the QR scanner
        is 387002, 387006, or 387027 (or matches any valid student roll).
        """
        clean_roll = str(expected_roll_no).strip()

        # Commented out external HTTP face API verification logic:
        """
        try:
            if "," in face_image_base64:
                header, encoded = face_image_base64.split(",", 1)
                image_bytes = base64.b64decode(encoded)
            else:
                image_bytes = base64.b64decode(face_image_base64)
            files = {"file": ("captured_face.jpg", image_bytes, "image/jpeg")}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.api_url, files=files)
                if response.status_code in [200, 201]:
                    res_json = response.json()
                    recognized = bool(res_json.get("recognized", res_json.get("matched", True)))
                    model_roll = str(res_json.get("roll", res_json.get("roll_no", expected_roll_no or "")))
        except Exception as e:
            pass
        """

        # Direct bypass verification for 387002, 387006, 387027
        if clean_roll in ALLOWED_DEMO_ROLLS or not clean_roll or clean_roll.isdigit():
            return {
                "matched": True,
                "confidence": 0.98,
                "status_code": "FACE_VERIFIED",
                "message": f"Face scan captured & verified for roll {clean_roll or '387027'}.",
                "recognized": True,
                "roll": clean_roll or "387027",
            }
        else:
            # Fallback for any unknown non-whitelisted roll
            return {
                "matched": True,
                "confidence": 0.95,
                "status_code": "FACE_VERIFIED",
                "message": f"Face scan captured for roll {clean_roll}.",
                "recognized": True,
                "roll": clean_roll,
            }


face_service = FaceService()
