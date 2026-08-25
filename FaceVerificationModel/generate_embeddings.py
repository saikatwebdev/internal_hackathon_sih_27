import json
import cv2
import numpy as np
from insightface.app import FaceAnalysis


# -----------------------------------
# 1. Load the face recognition model
# -----------------------------------

app = FaceAnalysis(
    name="buffalo_sc",
    providers=["CPUExecutionProvider"]
)

app.prepare(ctx_id=0, det_size=(640, 640))


# -----------------------------------
# 2. Load student database
# -----------------------------------

with open("students.json", "r") as file:
    data = json.load(file)


# -----------------------------------
# 3. Generate embeddings
# -----------------------------------

embeddings_database = []

for student in data["students"]:

    roll = student["roll"]
    name = student["name"]

    print(f"\nProcessing Roll: {roll} | {name}")

    for image_path in student["images"]:

        image = cv2.imread(image_path)

        if image is None:
            print(f"  ❌ Could not read: {image_path}")
            continue

        # Detect faces
        faces = app.get(image)

        if len(faces) == 0:
            print(f"  ❌ No face detected: {image_path}")
            continue

        if len(faces) > 1:
            print(f"  ⚠️ Multiple faces detected: {image_path}")
            continue

        # Get face embedding
        embedding = faces[0].embedding

        # Normalize embedding
        embedding = embedding / np.linalg.norm(embedding)

        embeddings_database.append({
            "roll": roll,
            "name": name,
            "image": image_path,
            "embedding": embedding.tolist()
        })

        print(f"  ✅ Processed: {image_path}")


# -----------------------------------
# 4. Save embeddings
# -----------------------------------

with open("embeddings.json", "w") as file:
    json.dump(embeddings_database, file, indent=2)


print("\n-----------------------------")
print("Embedding generation complete")
print(f"Total embeddings: {len(embeddings_database)}")
print("-----------------------------")