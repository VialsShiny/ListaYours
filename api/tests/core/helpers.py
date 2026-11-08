from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def owner_headers(owner: dict) -> dict[str, str]:
    return auth_headers(owner["access_token"])


def create_category(client: TestClient, owner: dict, name: str) -> dict:
    response = client.post("/api/owner/categories", json={"name": name}, headers=owner_headers(owner))
    assert response.status_code == 201, response.text
    return response.json()


def create_gift(client: TestClient, owner: dict, name: str = "Cadeau", **extra) -> dict:
    payload = {"name": name, "price": "19.90", "currency": "EUR", **extra}
    response = client.post("/api/owner/gifts", json=payload, headers=owner_headers(owner))
    assert response.status_code == 201, response.text
    return response.json()


def owner_slug(client: TestClient, owner: dict) -> str:
    response = client.get("/api/owner/wishlist", headers=owner_headers(owner))
    assert response.status_code == 200, response.text
    return response.json()["wishlist"]["slug"]


def reserve(client: TestClient, visitor: dict, gift_id: str):
    return client.post(f"/api/gifts/{gift_id}/reservation", headers=auth_headers(visitor["access_token"]))
