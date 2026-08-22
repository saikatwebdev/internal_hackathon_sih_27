def test_get_sessions(client, seed_test_data):
    # Faculty login
    fac_login = client.post("/api/auth/login", json={
        "username": "smith@test.com",
        "password": "faculty123",
        "role": "faculty"
    }).json()

    headers = {"Authorization": f"Bearer {fac_login['access_token']}"}
    res = client.get("/api/sessions", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
