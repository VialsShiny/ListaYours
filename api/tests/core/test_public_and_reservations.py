import threading

from tests.conftest import auth_headers, register
from tests.core.helpers import create_gift, owner_slug, reserve


def test_public_page_is_readable_without_login(client, owner) -> None:
    gift = create_gift(client, owner, "Visible")
    hidden = create_gift(client, owner, "Caché", is_visible=False)
    slug = owner_slug(client, owner)
    response = client.get(f"/api/public/wishlists/{slug}")
    assert response.status_code == 200
    body = response.json()
    assert body["wishlist"]["title"] == "Liste de Souhait"
    assert [g["id"] for g in body["gifts"]] == [gift["id"]]
    assert hidden["id"] not in [g["id"] for g in body["gifts"]]
    assert body["reservations_visible"] is False
    assert all(g["is_reserved"] is False for g in body["gifts"])
    assert client.get("/api/public/wishlists").json()[0]["slug"] == slug
    assert client.get("/api/public/wishlists/inconnue").status_code == 404


def test_visitor_reserve_cancel_and_my_reservations(client, owner, visitor, visitor2) -> None:
    gift = create_gift(client, owner, "Écran")
    slug = owner_slug(client, owner)
    created = reserve(client, visitor, gift["id"])
    assert created.status_code == 201, created.text
    assert created.json()["gift_id"] == gift["id"]

    as_visitor = client.get(f"/api/public/wishlists/{slug}", headers=auth_headers(visitor["access_token"])).json()
    assert as_visitor["reservations_visible"] is True
    assert as_visitor["gifts"][0]["is_reserved"] is True
    assert as_visitor["gifts"][0]["reserved_by_me"] is True

    as_other = client.get(f"/api/public/wishlists/{slug}", headers=auth_headers(visitor2["access_token"])).json()
    assert as_other["gifts"][0]["is_reserved"] is True
    assert as_other["gifts"][0]["reserved_by_me"] is False

    assert reserve(client, visitor2, gift["id"]).status_code == 409
    assert reserve(client, visitor, gift["id"]).status_code == 409

    mine = client.get("/api/me/reservations", headers=auth_headers(visitor["access_token"])).json()
    assert len(mine) == 1
    assert mine[0]["gift"]["name"] == "Écran"
    assert mine[0]["wishlist"]["slug"] == slug
    assert client.get("/api/me/reservations", headers=auth_headers(visitor2["access_token"])).json() == []

    other_cancel = client.delete(f"/api/gifts/{gift['id']}/reservation", headers=auth_headers(visitor2["access_token"]))
    assert other_cancel.status_code == 404
    own_cancel = client.delete(f"/api/gifts/{gift['id']}/reservation", headers=auth_headers(visitor["access_token"]))
    assert own_cancel.status_code == 204
    assert reserve(client, visitor2, gift["id"]).status_code == 201


def test_owner_anonymous_and_hidden_gifts_cannot_reserve(client, owner, visitor) -> None:
    gift = create_gift(client, owner, "Écran")
    hidden = create_gift(client, owner, "Caché", is_visible=False)
    assert client.post(f"/api/gifts/{gift['id']}/reservation").status_code == 401
    assert reserve(client, owner, gift["id"]).status_code == 403
    assert reserve(client, visitor, hidden["id"]).status_code == 404
    client.patch("/api/owner/wishlist", json={"is_published": False}, headers=auth_headers(owner["access_token"]))
    assert reserve(client, visitor, gift["id"]).status_code == 404


def test_concurrent_reservations_only_one_wins(client, owner) -> None:
    """Race test: many visitors hit the same gift at once; the database UNIQUE constraint lets exactly one through."""
    gift = create_gift(client, owner, "Unique")
    visitors = [register(client, f"racer{i}@listayours-test.fr", name=f"R{i}") for i in range(8)]
    barrier = threading.Barrier(len(visitors))
    statuses: list[int] = []
    lock = threading.Lock()

    def attempt(visitor: dict) -> None:
        barrier.wait()
        status = reserve(client, visitor, gift["id"]).status_code
        with lock:
            statuses.append(status)

    threads = [threading.Thread(target=attempt, args=(visitor,)) for visitor in visitors]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert sorted(statuses) == [201] + [409] * (len(visitors) - 1)
    winners = [
        v for v in visitors if client.get("/api/me/reservations", headers=auth_headers(v["access_token"])).json()
    ]
    assert len(winners) == 1
