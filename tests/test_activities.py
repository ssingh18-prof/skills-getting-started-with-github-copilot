from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_list_activities():
    response = client.get("/activities")

    assert response.status_code == 200
    assert len(response.json()) == 9
    assert "Chess Club" in response.json()


def test_signup_and_reject_duplicate():
    email = "new@mergington.edu"

    signup = client.post("/activities/Chess Club/signup", params={"email": email})
    duplicate = client.post("/activities/Chess Club/signup", params={"email": email})

    assert signup.status_code == 200
    assert duplicate.status_code == 400
    assert activities["Chess Club"]["participants"].count(email) == 1


@pytest.mark.parametrize("method", ["post", "delete"])
def test_unknown_activity_returns_404(method):
    response = getattr(client, method)(
        "/activities/Unknown/signup", params={"email": "new@mergington.edu"}
    )

    assert response.status_code == 404


def test_unregister_and_reject_missing_registration():
    email = "new@mergington.edu"
    client.post("/activities/Chess Club/signup", params={"email": email})

    removal = client.delete("/activities/Chess Club/signup", params={"email": email})
    repeated = client.delete("/activities/Chess Club/signup", params={"email": email})

    assert removal.status_code == 200
    assert repeated.status_code == 404
    assert email not in activities["Chess Club"]["participants"]