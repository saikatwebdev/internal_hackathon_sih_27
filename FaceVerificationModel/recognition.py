import json
import cv2
import numpy as np
from insightface.app import FaceAnalysis


# Load model once when the application starts

app = FaceAnalysis(
    name="buffalo_sc",
    providers=["CPUExecutionProvider"]
)

app.prepare(ctx_id=0, det_size=(640, 640))


# Load embeddings once
with open("embeddings.json", "r") as file:
    database = json.load(file)


def cosine_similarity(a, b):
    return np.dot(a, b) / (
        np.linalg.norm(a) * np.linalg.norm(b)
    )


def recognize_image(image_bytes):

    # Convert uploaded bytes → OpenCV image
    image_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image")

    # Detect face
    faces = app.get(image)

    if len(faces) == 0:
        raise ValueError("No face detected")

    if len(faces) > 1:
        raise ValueError("Multiple faces detected")

    # Generate embedding
    new_embedding = faces[0].embedding
    new_embedding = new_embedding / np.linalg.norm(new_embedding)

    best_match = None
    best_similarity = -1

    # Compare with database
    for person in database:

        stored_embedding = np.array(
            person["embedding"]
        )

        similarity = cosine_similarity(
            new_embedding,
            stored_embedding
        )

        if similarity > best_similarity:
            best_similarity = similarity
            best_match = person

    # Recognition threshold
    THRESHOLD = 0.5

    if best_similarity < THRESHOLD:
        return None

    return best_match["roll"]