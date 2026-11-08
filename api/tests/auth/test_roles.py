import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.base import get_db
from app.db.models import User
from app.deps import OwnerUser, VisitorUser
from app.main import app as main_app
from app.services.auth_service import create_access_token, decode_access_token
from tests.conftest import auth_headers

probe = FastAPI()


@probe.get("/owner-only")
def owner_only(user: OwnerUser) -> dict:
    return {"role": user.role}


@probe.get("/visitor-only")
def visitor_only(user: VisitorUser) -> dict:
    return {"role": user.role}


def probe_client(client: TestClient) -> TestClient:
    probe.dependency_overrides[get_db] = main_app.dependency_overrides[get_db]
    return TestClient(probe)


def test_owner_and_visitor_guards(client, owner, visitor) -> None:
    api = probe_client(client)
    assert api.get("/owner-only").status_code == 401
    assert api.get("/owner-only", headers=auth_headers(owner["access_token"])).status_code == 200
    assert api.get("/owner-only", headers=auth_headers(visitor["access_token"])).status_code == 403
    assert api.get("/visitor-only", headers=auth_headers(visitor["access_token"])).status_code == 200
    assert api.get("/visitor-only", headers=auth_headers(owner["access_token"])).status_code == 403


def test_token_for_deleted_or_unknown_user_is_rejected(client, owner) -> None:
    api = probe_client(client)

    ghost = User(id=uuid.uuid4(), email="ghost@listayours-test.fr", password_hash="x", display_name="g", role="owner")
    token = create_access_token(ghost)
    assert decode_access_token(token) == ghost.id
    assert api.get("/owner-only", headers=auth_headers(token)).status_code == 401


def test_tampered_token_is_rejected() -> None:
    someone = User(id=uuid.uuid4(), email="s@listayours-test.fr", password_hash="x", display_name="s", role="visitor")
    token = create_access_token(someone)
    assert decode_access_token(token + "x") is None
    assert decode_access_token("a.b.c") is None
