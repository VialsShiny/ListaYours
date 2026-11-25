from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app import limits
from app.main import app
from app.utils.rate_limit import SlidingWindowLimiter
from tests.conftest import auth_headers, register
from tests.core.helpers import create_gift, reserve


@pytest.fixture
def strict(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for limiter in (limits.login_limiter, limits.register_limiter, limits.account_limiter):
        monkeypatch.setattr(limiter, "limit", 2)
    yield


def test_me_and_logout_are_not_rate_limited(client: TestClient, strict: None) -> None:
    account = register(client, "me@listayours-test.fr")
    me = [client.get("/api/auth/me", headers=auth_headers(account["access_token"])).status_code for _ in range(25)]
    assert me == [200] * 25
    assert [client.post("/api/auth/logout").status_code for _ in range(25)] == [204] * 25


def test_budgets_are_separate(client: TestClient, strict: None) -> None:
    account = register(client, "a@listayours-test.fr")
    register(client, "b@listayours-test.fr")
    assert client.post("/api/auth/register", json={}).status_code == 429
    login = {"email": "a@listayours-test.fr", "password": "motdepasse123"}
    assert client.post("/api/auth/login", json=login).status_code == 200
    patch = client.patch("/api/account", json={"display_name": "A"}, headers=auth_headers(account["access_token"]))
    assert patch.status_code == 200


def test_login_is_limited_per_email_across_client_addresses(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setattr(limits.login_email_limiter, "limit", 3)
    attempt = {"email": "Cible@listayours-test.fr", "password": "mauvais-mdp"}
    statuses = []
    for i in range(4):
        with TestClient(app, client=(f"198.51.100.{i}", 40000)) as other:
            statuses.append(other.post("/api/auth/login", json=attempt).status_code)
    assert statuses == [401, 401, 401, 429]
    with TestClient(app, client=("198.51.100.99", 40000)) as other:
        lower = other.post("/api/auth/login", json={**attempt, "email": "cible@listayours-test.fr"})
        assert lower.status_code == 429
        unrelated = other.post("/api/auth/login", json={**attempt, "email": "autre@listayours-test.fr"})
        assert unrelated.status_code == 401


def test_reservations_are_limited_per_visitor(
    monkeypatch: pytest.MonkeyPatch, client: TestClient, owner: dict, visitor: dict, visitor2: dict
) -> None:
    monkeypatch.setattr(limits.reservation_limiter, "limit", 2)
    gift = create_gift(client, owner, "Limité")
    assert reserve(client, visitor, gift["id"]).status_code == 201
    cancel = client.delete(f"/api/gifts/{gift['id']}/reservation", headers=auth_headers(visitor["access_token"]))
    assert cancel.status_code == 204
    assert reserve(client, visitor, gift["id"]).status_code == 429
    assert reserve(client, visitor2, gift["id"]).status_code == 201


def test_idle_keys_are_dropped(monkeypatch: pytest.MonkeyPatch) -> None:
    clock = [1000.0]
    monkeypatch.setattr("app.utils.rate_limit.time.monotonic", lambda: clock[0])
    limiter = SlidingWindowLimiter(limit=1, window_seconds=10)
    assert limiter.allow("a") and limiter.allow("b")
    assert not limiter.allow("a")
    assert limiter.tracked_keys() == 2
    clock[0] += 11
    assert limiter.allow("c")
    assert limiter.tracked_keys() == 1
    assert limiter.allow("a")
