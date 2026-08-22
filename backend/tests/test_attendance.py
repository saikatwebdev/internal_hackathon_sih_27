from app.services.qr_service import qr_service


def test_qr_token_generation_and_validation(client, seed_test_data):
    session = seed_test_data["session"]
    student = seed_test_data["student"]

    # Student login
    login_res = client.post("/api/auth/login", json={
        "username": "23AI001",
        "password": "student123",
        "role": "student"
    }).json()

    headers = {"Authorization": f"Bearer {login_res['access_token']}"}

    # Generate QR token
    qr_res = client.post("/api/qr/generate", json={"session_id": session.id}, headers=headers)
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert "qr_token" in qr_data

    # Validate QR token
    is_valid, payload, err = qr_service.validate_qr_token(qr_data["qr_token"])
    assert is_valid is True
    assert payload["student_id"] == student.id


def test_entry_api_flow(client, seed_test_data):
    session = seed_test_data["session"]
    student = seed_test_data["student"]

    # Generate QR Token
    qr_data = qr_service.generate_student_session_qr(
        student_id=student.id,
        roll_no=student.roll_no,
        class_session_id=session.id
    )

    # Post Entry
    entry_payload = {
        "qr_token": qr_data["qr_token"],
        "roll": student.roll_no,
        "subject_code": "AI301",
        "date": "2026-08-22",
        "face_image": "data:image/png;base64,valid_mock_image_string",
        "scanner_id": "LAB204_SCANNER"
    }

    res = client.post("/api/attendance/entry", json=entry_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "ENTRY_RECORDED"
