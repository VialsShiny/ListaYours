from collections.abc import Iterator

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app import limits
from app.config import load_settings
from app.main import app
from app.middleware import csrf_guard, proxy_gate
from app.utils.session import SESSION_COOKIE, cookie_name
from tests.conftest import register

CREDENTIALS = {"email": "cookie@listayours-test.fr", "password": "motdepasse123"}


def login(client: TestClient):
    return client.post("/api/auth/login", json=CREDENTIALS)


def test_login_sets_an_httponly_lax_session_cookie(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    client.cookies.clear()
    response = login(client)
    assert response.status_code == 200
    header = response.headers["set-cookie"].lower()
    assert header.startswith(f"{SESSION_COOKIE}=")
    assert "httponly" in header and "samesite=lax" in header and "path=/" in header
    assert client.cookies.get(SESSION_COOKIE) == response.json()["access_token"]


def test_cookie_alone_authenticates_and_logout_clears_it(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    assert client.get("/api/auth/me").status_code == 401
    login(client)
    assert client.get("/api/auth/me").status_code == 200
    out = client.post("/api/auth/logout", headers={"Sec-Fetch-Site": "same-origin"})
    assert out.status_code == 204
    assert "max-age=0" in out.headers["set-cookie"].lower() or "expires=" in out.headers["set-cookie"].lower()
    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401


def test_production_cookie_uses_the_host_prefix(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("JWT_SECRET", "x" * 40)
    monkeypatch.setenv("OWNER_EMAIL", "o@example.com")
    monkeypatch.setenv("API_PROXY_SECRET", "p" * 32)
    monkeypatch.setenv("CORS_ORIGINS", "https://listayours.example")
    assert cookie_name(load_settings()) == "__Host-listayours_session"


def test_cookie_authenticated_mutation_needs_a_same_site_signal(client: TestClient) -> None:
    body = register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    login(client)
    patch = {"display_name": "Nouveau"}
    assert client.patch("/api/account", json=patch, headers={"Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert client.patch("/api/account", json=patch, headers={"Origin": "https://evil.example"}).status_code == 403
    assert client.patch("/api/account", json=patch).status_code == 403
    assert client.patch("/api/account", json=patch, headers={"Sec-Fetch-Site": "same-origin"}).status_code == 200
    assert client.patch("/api/account", json=patch, headers={"Origin": "http://localhost:3000"}).status_code == 200
    client.cookies.clear()
    bearer = {"Authorization": f"Bearer {body['access_token']}"}
    assert client.patch("/api/account", json=patch, headers=bearer).status_code == 200


def test_safe_methods_never_need_the_csrf_signal(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    login(client)
    assert client.get("/api/account").status_code == 200


def test_login_from_another_site_is_refused_but_plain_clients_pass(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    assert client.post("/api/auth/login", json=CREDENTIALS, headers={"Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert (
        client.post("/api/auth/login", json=CREDENTIALS, headers={"Origin": "https://evil.example"}).status_code == 403
    )
    assert (
        client.post("/api/auth/login", json=CREDENTIALS, headers={"Origin": "http://localhost:3000"}).status_code == 200
    )
    assert client.post("/api/auth/login", json=CREDENTIALS).status_code == 200


@pytest.fixture
def gated_client(monkeypatch) -> Iterator[TestClient]:
    monkeypatch.setenv("API_PROXY_SECRET", "proxy-secret-for-tests")
    settings = load_settings()
    gated = app.__class__(title="gated")
    gated.middleware("http")(csrf_guard(settings))
    gated.middleware("http")(proxy_gate(settings))

    @gated.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @gated.get("/api/ip")
    def ip(request: Request) -> dict:
        return {"ip": request.client.host if request.client else None}

    with TestClient(gated) as test_client:
        yield test_client


def test_proxy_gate_blocks_direct_calls_but_not_health(gated_client: TestClient) -> None:
    assert gated_client.get("/health").status_code == 200
    assert gated_client.get("/api/ip").status_code == 403
    assert gated_client.get("/api/ip", headers={"X-Proxy-Secret": "wrong"}).status_code == 403
    ok = gated_client.get("/api/ip", headers={"X-Proxy-Secret": "proxy-secret-for-tests", "X-Client-Ip": "203.0.113.9"})
    assert ok.status_code == 200 and ok.json()["ip"] == "203.0.113.9"


def test_client_ip_header_is_ignored_without_the_secret(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(limits.login_limiter, "limit", 2)
    codes = [
        client.post("/api/auth/login", json=CREDENTIALS, headers={"X-Client-Ip": f"198.51.100.{i}"}).status_code
        for i in range(3)
    ]
    assert codes[-1] == 429
