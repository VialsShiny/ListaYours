import json

from httpx import Response

from tests.conftest import auth_headers
from tests.core.helpers import reserve
from tests.privacy.conftest import assert_no_leak


def owner_surface(client, world: dict) -> list[tuple[str, Response]]:
    """Every owner-facing call, including reads of the public page with the owner's token."""
    headers = world["owner_headers"]
    gift_ids = [world["reserved"]["id"], world["free"]["id"], world["hidden"]["id"]]
    calls = [
        ("GET /api/owner/wishlist", client.get("/api/owner/wishlist", headers=headers)),
        ("GET /api/owner/gifts", client.get("/api/owner/gifts", headers=headers)),
        ("GET /api/owner/categories", client.get("/api/owner/categories", headers=headers)),
        ("GET /api/auth/me", client.get("/api/auth/me", headers=headers)),
        ("GET /api/public/wishlists", client.get("/api/public/wishlists", headers=headers)),
        (
            "GET /api/public/wishlists/{slug}",
            client.get(f"/api/public/wishlists/{world['slug']}", headers=headers),
        ),
        ("PATCH /api/owner/wishlist", client.patch("/api/owner/wishlist", json={"description": "x"}, headers=headers)),
        (
            "PUT /api/owner/gifts/reorder",
            client.put("/api/owner/gifts/reorder", json={"ids": gift_ids}, headers=headers),
        ),
        (
            "PUT /api/owner/categories/reorder",
            client.put(
                "/api/owner/categories/reorder", json={"ids": [c["id"] for c in world["categories"]]}, headers=headers
            ),
        ),
    ]
    for gift_id in gift_ids:
        calls.append((f"GET /api/owner/gifts/{gift_id}", client.get(f"/api/owner/gifts/{gift_id}", headers=headers)))
        calls.append(
            (
                f"PATCH /api/owner/gifts/{gift_id}",
                client.patch(f"/api/owner/gifts/{gift_id}", json={"description": "maj"}, headers=headers),
            )
        )
    return calls


def strip_false_public_flags(body: dict) -> dict:
    """The public payload carries reservation flags by design; for the owner they must all be false."""
    assert body["reservations_visible"] is False
    gifts = []
    for gift in body["gifts"]:
        assert gift["is_reserved"] is False and gift["reserved_by_me"] is False, gift["name"]
        gifts.append({k: v for k, v in gift.items() if k not in {"is_reserved", "reserved_by_me"}})
    return {**body, "gifts": gifts, "reservations_visible": None}


def test_every_owner_facing_response_is_free_of_reservation_data(client, world) -> None:
    for name, response in owner_surface(client, world):
        assert response.status_code < 400, (name, response.text)
        text = response.text
        if name == "GET /api/public/wishlists/{slug}":
            text = json.dumps(strip_false_public_flags(response.json()))
        assert_no_leak(text, world)
        assert_no_leak(str(dict(response.headers)), world)


def test_owner_sees_every_gift_as_available_on_the_public_page(client, world) -> None:
    body = client.get(f"/api/public/wishlists/{world['slug']}", headers=world["owner_headers"]).json()
    assert body["reservations_visible"] is False
    assert {gift["id"] for gift in body["gifts"]} == {world["reserved"]["id"], world["free"]["id"]}
    assert all(gift["is_reserved"] is False and gift["reserved_by_me"] is False for gift in body["gifts"])
    as_visitor = client.get(
        f"/api/public/wishlists/{world['slug']}", headers=auth_headers(world["visitor2"]["access_token"])
    ).json()
    assert [g["is_reserved"] for g in as_visitor["gifts"] if g["id"] == world["reserved"]["id"]] == [True]


def test_owner_view_is_identical_before_during_and_after_a_reservation(client, owner, visitor) -> None:
    from tests.core.helpers import create_gift

    headers = auth_headers(owner["access_token"])
    gift = create_gift(client, owner, "Identique")
    before = client.get("/api/owner/wishlist", headers=headers).json()
    before_gift = client.get(f"/api/owner/gifts/{gift['id']}", headers=headers).json()
    assert reserve(client, visitor, gift["id"]).status_code == 201
    during = client.get("/api/owner/wishlist", headers=headers).json()
    during_gift = client.get(f"/api/owner/gifts/{gift['id']}", headers=headers).json()
    client.delete(f"/api/gifts/{gift['id']}/reservation", headers=auth_headers(visitor["access_token"]))
    after = client.get("/api/owner/wishlist", headers=headers).json()
    assert before == during == after
    assert before_gift == during_gift
    assert during_gift["updated_at"] == before_gift["updated_at"]


def test_deleting_reserved_and_unreserved_gifts_looks_the_same_to_the_owner(client, world) -> None:
    headers = world["owner_headers"]
    reserved = client.delete(f"/api/owner/gifts/{world['reserved']['id']}", headers=headers)
    free = client.delete(f"/api/owner/gifts/{world['free']['id']}", headers=headers)
    assert (reserved.status_code, reserved.text) == (free.status_code, free.text) == (204, "")
    again_reserved = client.delete(f"/api/owner/gifts/{world['reserved']['id']}", headers=headers)
    again_free = client.delete(f"/api/owner/gifts/{world['free']['id']}", headers=headers)
    assert again_reserved.status_code == again_free.status_code == 404
    assert again_reserved.json() == again_free.json()
    mine = client.get("/api/me/reservations", headers=auth_headers(world["visitor"]["access_token"])).json()
    assert mine == []


def test_editing_a_reserved_gift_behaves_like_editing_a_free_one(client, world) -> None:
    headers = world["owner_headers"]
    for gift in (world["reserved"], world["free"]):
        response = client.patch(f"/api/owner/gifts/{gift['id']}", json={"price": "10"}, headers=headers)
        assert response.status_code == 200
        assert_no_leak(response.text, world)
        assert set(response.json()) == set(gift)


def test_owner_account_has_no_reservation_capabilities(client, world) -> None:
    headers = world["owner_headers"]
    assert client.get("/api/me/reservations", headers=headers).status_code == 403
    assert client.post(f"/api/gifts/{world['free']['id']}/reservation", headers=headers).status_code == 403
    assert client.delete(f"/api/gifts/{world['reserved']['id']}/reservation", headers=headers).status_code == 403


def test_anonymous_readers_do_not_see_reservation_state(client, world) -> None:
    body = client.get(f"/api/public/wishlists/{world['slug']}").json()
    assert body["reservations_visible"] is False
    assert all(gift["is_reserved"] is False for gift in body["gifts"])
