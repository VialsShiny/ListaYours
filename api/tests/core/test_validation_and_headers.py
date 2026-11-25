import uuid

from fastapi.testclient import TestClient

from tests.conftest import auth_headers
from tests.core.helpers import create_category, create_gift, owner_headers, reserve


def test_currency_must_be_three_letters(client: TestClient, owner: dict) -> None:
    headers = owner_headers(owner)
    assert create_gift(client, owner, "Dollar", currency=" usd ")["currency"] == "USD"
    for currency in ("U5D", "EU", "EURO", "ÉUR", "e r"):
        response = client.post("/api/owner/gifts", json={"name": "x", "currency": currency}, headers=headers)
        assert response.status_code == 422, currency


def test_reorder_mismatch_is_a_400_and_the_list_is_bounded(client: TestClient, owner: dict) -> None:
    headers = owner_headers(owner)
    gift = create_gift(client, owner, "Seul")
    category = create_category(client, owner, "Unique")
    for path, own_id in (("/api/owner/gifts/reorder", gift["id"]), ("/api/owner/categories/reorder", category["id"])):
        foreign = client.put(path, json={"ids": [str(uuid.uuid4())]}, headers=headers)
        assert foreign.status_code == 400, path
        assert "ne correspond pas" in foreign.json()["detail"]
        duplicated = client.put(path, json={"ids": [own_id, own_id]}, headers=headers)
        assert duplicated.status_code == 400, path
        too_many = client.put(path, json={"ids": [str(uuid.uuid4()) for _ in range(1001)]}, headers=headers)
        assert too_many.status_code == 422, path
        assert client.put(path, json={"ids": []}, headers=headers).status_code == 422


def test_my_reservations_hide_gifts_that_are_no_longer_public(client: TestClient, owner: dict, visitor: dict) -> None:
    shown = create_gift(client, owner, "Montré")
    hidden = create_gift(client, owner, "Bientôt caché")
    assert reserve(client, visitor, shown["id"]).status_code == 201
    assert reserve(client, visitor, hidden["id"]).status_code == 201
    mine = auth_headers(visitor["access_token"])
    client.patch(f"/api/owner/gifts/{hidden['id']}", json={"is_visible": False}, headers=owner_headers(owner))
    names = [item["gift"]["name"] for item in client.get("/api/me/reservations", headers=mine).json()]
    assert names == ["Montré"]
    client.patch("/api/owner/wishlist", json={"is_published": False}, headers=owner_headers(owner))
    assert client.get("/api/me/reservations", headers=mine).json() == []


def test_security_headers(client: TestClient, visitor: dict) -> None:
    api = client.get("/api/public/wishlists")
    assert api.headers["x-content-type-options"] == "nosniff"
    assert api.headers["cache-control"] == "no-store"
    denied = client.get("/api/account")
    assert denied.status_code == 401 and denied.headers["cache-control"] == "no-store"
    health = client.get("/health")
    assert health.headers["x-content-type-options"] == "nosniff"
    assert "cache-control" not in health.headers


def test_cors_allows_only_the_listed_methods_and_headers(client: TestClient) -> None:
    preflight = client.options(
        "/api/account",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert preflight.status_code == 200
    refused = client.options(
        "/api/account",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "x-anything",
        },
    )
    assert refused.status_code == 400
