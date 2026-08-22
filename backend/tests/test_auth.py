def test_login_success(client, seed_test_data):
    res = client.post("/api/auth/login", json={
        "username": "admin@test.com",
        "password": "admin123",
        "role": "super_admin"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "super_admin"


def test_login_invalid_password(client, seed_test_data):
    res = client.post("/api/auth/login", json={
        "username": "admin@test.com",
        "password": "wrongpassword",
        "role": "super_admin"
    })
    assert res.status_code == 401


def test_student_login(client, seed_test_data):
    res = client.post("/api/auth/login", json={
        "username": "23AI001",
        "password": "student123",
        "role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["roll_no"] == "23AI001"
