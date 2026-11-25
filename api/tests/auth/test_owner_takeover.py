from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import User
from tests.conftest import auth_headers, register

OWNER_EMAIL = "owner@listayours-test.fr"


def test_owner_cannot_move_away_from_the_configured_email(client: TestClient, owner: dict) -> None:
    moved = client.patch(
        "/api/account",
        json={"email": "ailleurs@listayours-test.fr", "current_password": "motdepasse123"},
        headers=auth_headers(owner["access_token"]),
    )
    assert moved.status_code == 409
    assert moved.json()["detail"] == "L'e-mail du propriétaire est fixé par la configuration."
    me = client.get("/api/auth/me", headers=auth_headers(owner["access_token"])).json()
    assert me["email"] == OWNER_EMAIL and me["role"] == "owner"
    renamed = client.patch("/api/account", json={"display_name": "Moi"}, headers=auth_headers(owner["access_token"]))
    assert renamed.status_code == 200


def test_owner_email_grants_the_owner_role_only_once(client: TestClient, db: Session) -> None:
    db.add(User(email="ancien@listayours-test.fr", password_hash="x", display_name="Ancien", role="owner"))
    db.commit()
    body = register(client, OWNER_EMAIL)
    assert body["user"]["role"] == "visitor"


def test_register_refuses_a_blank_display_name(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "vide@listayours-test.fr", "password": "motdepasse123", "display_name": "   "},
    )
    assert response.status_code == 422
    trimmed = register(client, "plein@listayours-test.fr", name="  Léa  ")
    assert trimmed["user"]["display_name"] == "Léa"
