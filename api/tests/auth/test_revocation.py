import uuid
from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.config import get_settings
from app.services.auth_service import TOKEN_ISSUER, decode_access_token
from app.utils.session import SESSION_COOKIE
from tests.conftest import auth_headers, register

EMAIL = "revoke@listayours-test.fr"
SAME_SITE = {"Sec-Fetch-Site": "same-origin"}
CHANGE = {"current_password": "motdepasse123", "new_password": "nouveaumdp456"}


def signed(payload: dict) -> str:
    return jwt.encode(payload, get_settings().jwt_secret, algorithm="HS256")


def claims(**overrides: object) -> dict:
    now = datetime.now(UTC)
    payload: dict = {
        "sub": str(uuid.uuid4()),
        "ver": 0,
        "iss": TOKEN_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
    }
    payload.update(overrides)
    return {key: value for key, value in payload.items() if value is not None}


def test_password_change_revokes_old_tokens_and_reissues_the_cookie(client: TestClient) -> None:
    account = register(client, EMAIL)
    old = auth_headers(account["access_token"])
    changed = client.post("/api/account/password", json=CHANGE, headers=old)
    assert changed.status_code == 204
    assert changed.content == b""
    fresh_cookie = changed.cookies.get(SESSION_COOKIE)
    assert fresh_cookie
    assert client.get("/api/auth/me", headers=old).status_code == 401
    client.cookies.clear()
    client.cookies.set(SESSION_COOKIE, fresh_cookie)
    assert client.get("/api/auth/me").status_code == 200


def test_password_change_from_the_browser_keeps_that_browser_signed_in(client: TestClient) -> None:
    register(client, EMAIL)
    client.post("/api/auth/login", json={"email": EMAIL, "password": "motdepasse123"})
    stale = client.cookies.get(SESSION_COOKIE)
    assert client.post("/api/account/password", json=CHANGE, headers=SAME_SITE).status_code == 204
    assert client.cookies.get(SESSION_COOKIE) != stale
    assert client.get("/api/auth/me").status_code == 200
    assert client.get("/api/auth/me", headers=auth_headers(stale or "")).status_code == 401


def test_logout_revokes_every_session(client: TestClient) -> None:
    account = register(client, EMAIL)
    other_device = auth_headers(account["access_token"])
    client.post("/api/auth/login", json={"email": EMAIL, "password": "motdepasse123"})
    assert client.post("/api/auth/logout", headers=SAME_SITE).status_code == 204
    assert client.get("/api/auth/me", headers=other_device).status_code == 401
    again = client.post("/api/auth/login", json={"email": EMAIL, "password": "motdepasse123"})
    assert client.get("/api/auth/me", headers=auth_headers(again.json()["access_token"])).status_code == 200


def test_logout_without_a_session_still_answers_204(client: TestClient) -> None:
    assert client.post("/api/auth/logout").status_code == 204


def test_tokens_missing_a_claim_or_with_a_foreign_issuer_are_refused(client: TestClient) -> None:
    account = register(client, EMAIL)
    user_id = account["user"]["id"]
    valid = signed(claims(sub=user_id))
    assert client.get("/api/auth/me", headers=auth_headers(valid)).status_code == 200
    for broken in (
        claims(sub=user_id, exp=None),
        claims(sub=user_id, iat=None),
        claims(sub=user_id, ver=None),
        claims(sub=user_id, iss=None),
        claims(sub=user_id, iss="someone-else"),
        claims(sub=user_id, ver="0"),
        claims(sub=user_id, ver=1),
    ):
        token = signed(broken)
        assert client.get("/api/auth/me", headers=auth_headers(token)).status_code == 401, broken
    assert decode_access_token(signed(claims(sub=None))) is None


def test_issued_tokens_carry_no_role(client: TestClient) -> None:
    account = register(client, EMAIL)
    payload = jwt.decode(account["access_token"], options={"verify_signature": False})
    assert set(payload) == {"sub", "ver", "iss", "iat", "exp"}
    assert payload["iss"] == TOKEN_ISSUER
