import os
import requests

BASE_URL = os.environ.get("EXPO_BACKEND_URL", "https://campaign-analytics-34.preview.emergentagent.com").rstrip("/")


def login(email):
    response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "UrnaPro@2026"})
    assert response.status_code == 200
    return response.json()


def test_scenarios_and_update_persistence_restore():
    auth = login("admin@urnapro.app")
    headers = {"Authorization": f"Bearer {auth['token']}"}
    original = requests.get(f"{BASE_URL}/api/campaign", headers=headers).json()
    payload = {"target_votes": 12000, "confirmed_votes": 7000, "estimated_votes": 4000}
    updated = requests.put(f"{BASE_URL}/api/campaign", headers=headers, json=payload)
    assert updated.status_code == 200
    assert updated.json()["scenarios"]["ruim"]["projected_votes"] == 9800
    persisted = requests.get(f"{BASE_URL}/api/campaign", headers=headers).json()
    assert persisted["confirmed_votes"] == 7000
    requests.put(f"{BASE_URL}/api/campaign", headers=headers, json={k: original[k] for k in payload})


def test_collaborator_cannot_invite():
    auth = login("colaborador@urnapro.app")
    response = requests.post(f"{BASE_URL}/api/team", headers={"Authorization": f"Bearer {auth['token']}"}, json={"name": "TEST Blocked", "email": "test-blocked@example.com", "password": "secret123"})
    assert response.status_code == 403