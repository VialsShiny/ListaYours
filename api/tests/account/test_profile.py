from app import deps
from tests.account.helpers import assert_no_secret, headers
from tests.conftest import register


def test_anonymous_requests_are_rejected(client) -> None:
    assert client.get("/api/account").status_code == 401
    assert client.patch("/api/account", json={"display_name": "x"}).status_code == 401
    assert (
        client.post("/api/account/password", json={"current_password": "a", "new_password": "b" * 8}).status_code == 401
    )
    assert client.get("/api/account/avatar").status_code == 401
    assert client.put("/api/account/avatar", content=b"x").status_code == 401
    assert client.delete("/api/account/avatar").status_code == 401


def test_read_own_account_without_secrets(client, visitor) -> None:
    response = client.get("/api/account", headers=headers(visitor))
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "visitor@listayours-test.fr"
    assert body["role"] == "visitor"
    assert body["has_avatar"] is False
    assert body["avatar_updated_at"] is None
    assert_no_secret(body)


def test_update_display_name_and_email(client, visitor) -> None:
    response = client.patch(
        "/api/account",
        json={"display_name": "  Oriane  ", "email": "Oriane@Listayours-Test.fr"},
        headers=headers(visitor),
    )
    assert response.status_code == 200, response.text
    assert response.json()["display_name"] == "Oriane"
    assert response.json()["email"] == "oriane@listayours-test.fr"
    assert_no_secret(response.json())
    login = client.post("/api/auth/login", json={"email": "oriane@listayours-test.fr", "password": "motdepasse123"})
    assert login.status_code == 200


def test_user_cannot_touch_another_account(client, visitor, visitor2) -> None:
    client.patch("/api/account", json={"display_name": "Changé"}, headers=headers(visitor))
    other = client.get("/api/account", headers=headers(visitor2)).json()
    assert other["display_name"] == "Baptistin-Qz"
    assert other["id"] == visitor2["user"]["id"]
    assert other["id"] != visitor["user"]["id"]
    assert client.get(f"/api/account/{visitor2['user']['id']}", headers=headers(visitor)).status_code in (404, 405)


def test_role_is_read_only(client, visitor) -> None:
    response = client.patch("/api/account", json={"role": "owner"}, headers=headers(visitor))
    assert response.status_code == 422
    assert client.get("/api/account", headers=headers(visitor)).json()["role"] == "visitor"
    combined = client.patch("/api/account", json={"display_name": "x", "role": "owner"}, headers=headers(visitor))
    assert combined.status_code == 422
    assert client.get("/api/account", headers=headers(visitor)).json()["display_name"] == "Oriane-Qx"


def test_email_uniqueness_and_owner_email_are_enforced(client, owner, visitor, visitor2) -> None:
    taken = client.patch("/api/account", json={"email": "visitor2@listayours-test.fr"}, headers=headers(visitor))
    assert taken.status_code == 409
    reserved = client.patch("/api/account", json={"email": "owner@listayours-test.fr"}, headers=headers(visitor))
    assert reserved.status_code == 409
    same = client.patch("/api/account", json={"email": "visitor@listayours-test.fr"}, headers=headers(visitor))
    assert same.status_code == 200
    invalid = client.patch("/api/account", json={"email": "pas-un-mail"}, headers=headers(visitor))
    assert invalid.status_code == 422
    empty = client.patch("/api/account", json={"display_name": "   "}, headers=headers(visitor))
    assert empty.status_code == 422


def test_password_change_requires_the_current_password(client) -> None:
    account = register(client, "lea@listayours-test.fr", password="motdepasse123")
    wrong = client.post(
        "/api/account/password",
        json={"current_password": "mauvais-mdp", "new_password": "nouveaumdp456"},
        headers=headers(account),
    )
    assert wrong.status_code == 400
    assert (
        client.post(
            "/api/auth/login", json={"email": "lea@listayours-test.fr", "password": "motdepasse123"}
        ).status_code
        == 200
    )
    short = client.post(
        "/api/account/password",
        json={"current_password": "motdepasse123", "new_password": "court"},
        headers=headers(account),
    )
    assert short.status_code == 422
    ok = client.post(
        "/api/account/password",
        json={"current_password": "motdepasse123", "new_password": "nouveaumdp456"},
        headers=headers(account),
    )
    assert ok.status_code == 204
    assert ok.content == b""
    old = client.post("/api/auth/login", json={"email": "lea@listayours-test.fr", "password": "motdepasse123"})
    assert old.status_code == 401
    new = client.post("/api/auth/login", json={"email": "lea@listayours-test.fr", "password": "nouveaumdp456"})
    assert new.status_code == 200


def test_password_change_is_rate_limited(client, visitor) -> None:
    deps.auth_limiter.limit = 2
    deps.auth_limiter.reset()
    try:
        statuses = [
            client.post(
                "/api/account/password",
                json={"current_password": "mauvais-mdp", "new_password": "nouveaumdp456"},
                headers=headers(visitor),
            ).status_code
            for _ in range(3)
        ]
    finally:
        deps.auth_limiter.limit = 1000
    assert statuses == [400, 400, 429]
