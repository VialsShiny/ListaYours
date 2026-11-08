from tests.conftest import auth_headers, register


def test_register_returns_token_and_visitor_role(client) -> None:
    body = register(client, "lea@listayours-test.fr", name="Léa")
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "lea@listayours-test.fr"
    assert body["user"]["role"] == "visitor"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_owner_email_registers_as_owner(client) -> None:
    body = register(client, "Owner@Listayours-Test.fr", name="Thibault")
    assert body["user"]["role"] == "owner"
    assert body["user"]["email"] == "owner@listayours-test.fr"


def test_duplicate_email_is_rejected(client) -> None:
    register(client, "lea@listayours-test.fr")
    response = client.post(
        "/api/auth/register", json={"email": "LEA@listayours-test.fr", "password": "motdepasse123", "display_name": "x"}
    )
    assert response.status_code == 409


def test_password_rules(client) -> None:
    short = client.post(
        "/api/auth/register", json={"email": "a@listayours-test.fr", "password": "court", "display_name": "x"}
    )
    assert short.status_code == 422
    long_password = "x" * 73
    too_long = client.post(
        "/api/auth/register", json={"email": "b@listayours-test.fr", "password": long_password, "display_name": "x"}
    )
    assert too_long.status_code == 422


def test_password_byte_length_is_checked(client) -> None:
    multibyte = "é" * 40
    response = client.post(
        "/api/auth/register", json={"email": "c@listayours-test.fr", "password": multibyte, "display_name": "x"}
    )
    assert response.status_code == 422


def test_forwarded_for_header_does_not_bypass_rate_limit(client) -> None:
    from app import deps

    original = deps.auth_limiter.limit
    deps.auth_limiter.limit = 2
    try:
        statuses = [
            client.post(
                "/api/auth/login",
                json={"email": "x@listayours-test.fr", "password": "motdepasse123"},
                headers={"X-Forwarded-For": f"10.0.0.{i}"},
            ).status_code
            for i in range(3)
        ]
    finally:
        deps.auth_limiter.limit = original
    assert statuses == [401, 401, 429]


def test_login_success_and_failure(client) -> None:
    register(client, "lea@listayours-test.fr", password="motdepasse123")
    ok = client.post("/api/auth/login", json={"email": "lea@listayours-test.fr", "password": "motdepasse123"})
    assert ok.status_code == 200
    assert ok.json()["user"]["email"] == "lea@listayours-test.fr"
    bad = client.post("/api/auth/login", json={"email": "lea@listayours-test.fr", "password": "mauvais-mdp"})
    assert bad.status_code == 401
    unknown = client.post("/api/auth/login", json={"email": "nobody@listayours-test.fr", "password": "motdepasse123"})
    assert unknown.status_code == 401


def test_me_requires_valid_token(client) -> None:
    body = register(client, "lea@listayours-test.fr")
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers=auth_headers("not-a-token")).status_code == 401
    me = client.get("/api/auth/me", headers=auth_headers(body["access_token"]))
    assert me.status_code == 200
    assert me.json()["id"] == body["user"]["id"]


def test_auth_endpoints_are_rate_limited(client) -> None:
    from app import deps

    deps.auth_limiter.limit = 3
    try:
        statuses = [
            client.post(
                "/api/auth/login", json={"email": "x@listayours-test.fr", "password": "motdepasse123"}
            ).status_code
            for _ in range(4)
        ]
    finally:
        deps.auth_limiter.limit = 1000
    assert statuses[:3] == [401, 401, 401]
    assert statuses[3] == 429
