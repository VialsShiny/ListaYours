from tests.conftest import auth_headers
from tests.core.helpers import create_category, create_gift, owner_headers


def test_owner_gets_default_wishlist(client, owner) -> None:
    response = client.get("/api/owner/wishlist", headers=owner_headers(owner))
    assert response.status_code == 200
    body = response.json()
    assert body["wishlist"]["title"] == "Liste de Souhait"
    assert body["wishlist"]["slug"] == "liste-de-souhait"
    assert body["wishlist"]["is_published"] is True
    assert body["categories"] == []
    assert body["gifts"] == []


def test_visitor_cannot_access_owner_endpoints(client, visitor) -> None:
    headers = auth_headers(visitor["access_token"])
    assert client.get("/api/owner/wishlist", headers=headers).status_code == 403
    assert client.get("/api/owner/gifts", headers=headers).status_code == 403
    assert client.post("/api/owner/categories", json={"name": "x"}, headers=headers).status_code == 403
    assert client.get("/api/owner/wishlist").status_code == 401


def test_update_settings_and_slug_uniqueness(client, owner) -> None:
    response = client.patch(
        "/api/owner/wishlist",
        json={"title": "Noël 2026", "description": "Mes envies", "slug": "Noël 2026 !", "is_published": False},
        headers=owner_headers(owner),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["title"] == "Noël 2026"
    assert body["slug"] == "noel-2026"
    assert body["is_published"] is False
    assert client.get("/api/public/wishlists/noel-2026").status_code == 404
    again = client.patch("/api/owner/wishlist", json={"slug": "noel-2026"}, headers=owner_headers(owner))
    assert again.json()["slug"] == "noel-2026"


def test_owner_view_lists_categories_and_gifts_in_order(client, owner) -> None:
    cat_a = create_category(client, owner, "Les essentiels")
    cat_b = create_category(client, owner, "Les Vêtements")
    gift_1 = create_gift(client, owner, "Écran", category_id=cat_a["id"])
    gift_2 = create_gift(client, owner, "Pull", category_id=cat_b["id"])
    body = client.get("/api/owner/wishlist", headers=owner_headers(owner)).json()
    assert [c["name"] for c in body["categories"]] == ["Les essentiels", "Les Vêtements"]
    assert [g["id"] for g in body["gifts"]] == [gift_1["id"], gift_2["id"]]
    assert body["gifts"][0]["price"] == "19.90"
