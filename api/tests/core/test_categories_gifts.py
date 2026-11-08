import uuid

from tests.core.helpers import create_category, create_gift, owner_headers


def test_category_crud_and_reorder(client, owner) -> None:
    a = create_category(client, owner, "A")
    b = create_category(client, owner, "B")
    headers = owner_headers(owner)
    assert client.post("/api/owner/categories", json={"name": "A"}, headers=headers).status_code == 409
    renamed = client.patch(f"/api/owner/categories/{a['id']}", json={"name": "AA"}, headers=headers)
    assert renamed.json()["name"] == "AA"
    reordered = client.put("/api/owner/categories/reorder", json={"ids": [b["id"], a["id"]]}, headers=headers)
    assert [c["id"] for c in reordered.json()] == [b["id"], a["id"]]
    bad = client.put("/api/owner/categories/reorder", json={"ids": [b["id"]]}, headers=headers)
    assert bad.status_code == 404
    gift = create_gift(client, owner, "Dans A", category_id=a["id"])
    assert client.delete(f"/api/owner/categories/{a['id']}", headers=headers).status_code == 204
    detached = client.get(f"/api/owner/gifts/{gift['id']}", headers=headers).json()
    assert detached["category_id"] is None
    assert client.delete(f"/api/owner/categories/{uuid.uuid4()}", headers=headers).status_code == 404


def test_gift_crud_validation_and_reorder(client, owner) -> None:
    headers = owner_headers(owner)
    gift = create_gift(
        client,
        owner,
        "Moniteur",
        description="27 pouces",
        image_url="https://img.example.com/a.jpg",
        purchase_url="https://www.amazon.fr/dp/B0CZ762XQ3",
        price="199",
        old_price="229.5",
    )
    assert gift["price"] == "199.00"
    assert gift["old_price"] == "229.50"
    assert gift["position"] == 0
    assert gift["is_visible"] is True
    second = create_gift(client, owner, "Clavier")
    assert second["position"] == 1

    updated = client.patch(
        f"/api/owner/gifts/{gift['id']}",
        json={"name": "Moniteur 27", "is_visible": False, "currency": "usd"},
        headers=headers,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Moniteur 27"
    assert updated.json()["is_visible"] is False
    assert updated.json()["currency"] == "USD"

    invalid_url = client.post("/api/owner/gifts", json={"name": "x", "purchase_url": "not-a-url"}, headers=headers)
    assert invalid_url.status_code == 422
    negative = client.post("/api/owner/gifts", json={"name": "x", "price": "-1"}, headers=headers)
    assert negative.status_code == 422
    unknown_category = client.post(
        "/api/owner/gifts", json={"name": "x", "category_id": str(uuid.uuid4())}, headers=headers
    )
    assert unknown_category.status_code == 404

    reordered = client.put("/api/owner/gifts/reorder", json={"ids": [second["id"], gift["id"]]}, headers=headers)
    assert [g["id"] for g in reordered.json()] == [second["id"], gift["id"]]
    assert [g["position"] for g in reordered.json()] == [0, 1]

    assert client.delete(f"/api/owner/gifts/{gift['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/owner/gifts/{gift['id']}", headers=headers).status_code == 404
    assert client.delete(f"/api/owner/gifts/{gift['id']}", headers=headers).status_code == 404


def test_owner_gift_payload_has_no_reservation_fields(client, owner) -> None:
    gift = create_gift(client, owner, "Sans réservation")
    assert set(gift) == {
        "id",
        "category_id",
        "name",
        "description",
        "image_url",
        "price",
        "old_price",
        "currency",
        "purchase_url",
        "position",
        "is_visible",
        "created_at",
        "updated_at",
    }
