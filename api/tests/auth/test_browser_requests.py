from fastapi.testclient import TestClient

from app.utils.session import SESSION_COOKIE
from tests.conftest import register

CREDENTIALS = {"email": "browser@listayours-test.fr", "password": "motdepasse123"}


def login(client: TestClient, headers: dict[str, str] | None = None):
    return client.post("/api/auth/login", json=CREDENTIALS, headers=headers or {})


def test_cookie_call_with_a_non_bearer_authorization_still_needs_the_csrf_signal(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    login(client)
    patch = {"display_name": "Pirate"}
    for authorization in ("Basic x", "Bearer", "Bearer   ", "bearerx"):
        forged = {"Origin": "https://evil.example", "Authorization": authorization}
        assert client.patch("/api/account", json=patch, headers=forged).status_code == 403, authorization


def test_any_authorization_header_disables_the_cookie_fallback(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    login(client)
    assert client.get("/api/account").status_code == 200
    assert client.get("/api/account", headers={"Authorization": "Basic x"}).status_code == 401
    assert client.get("/api/account", headers={"Authorization": "Bearer not-a-token"}).status_code == 401


def test_browser_logins_get_the_cookie_only(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    for headers in ({"Sec-Fetch-Site": "same-origin"}, {"Origin": "http://localhost:3000"}):
        client.cookies.clear()
        response = login(client, headers)
        assert response.status_code == 200
        assert response.json()["access_token"] is None
        assert response.json()["user"]["email"] == CREDENTIALS["email"]
        assert client.cookies.get(SESSION_COOKIE)


def test_browser_register_gets_the_cookie_only(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={**CREDENTIALS, "display_name": "Navigateur"},
        headers={"Sec-Fetch-Site": "same-origin"},
    )
    assert response.status_code == 201
    assert response.json()["access_token"] is None
    assert client.get("/api/auth/me").status_code == 200


def test_plain_clients_still_receive_the_token(client: TestClient) -> None:
    register(client, CREDENTIALS["email"], CREDENTIALS["password"])
    body = login(client).json()
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body["token_type"] == "bearer"
