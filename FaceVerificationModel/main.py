from fastapi import FastAPI, UploadFile, File, HTTPException
from datetime import datetime

from recognition import recognize_image


app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Face Recognition API is running"
    }


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):

    # Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image"
        )

    # Read uploaded image
    image_bytes = await file.read()

    try:

        roll = recognize_image(image_bytes)

        if roll is None:
            return {
                "recognized": False,
                "roll": None
            }

        now = datetime.now()

        return {
            "recognized": True,
            "roll": roll,
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S")
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )