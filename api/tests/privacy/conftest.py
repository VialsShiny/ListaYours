import pytest

from tests.conftest import auth_headers
from tests.core.helpers import create_category, create_gift, owner_slug, reserve

FORBIDDEN_MARKERS = ("reserv", "visitor", "booked", "taken")


@pytest.fixture
def world(client, owner, visitor, visitor2) -> dict:
    """An owner with categories and gifts, one of which is reserved by a visitor."""
    essentials = create_category(client, owner, "Les essentiels")
    clothes = create_category(client, owner, "Les Vêtements")
    reserved = create_gift(client, owner, "Moniteur", category_id=essentials["id"], price="199.00")
    free = create_gift(client, owner, "Pull", category_id=clothes["id"], price="62.95")
    hidden = create_gift(client, owner, "Caché", is_visible=False)
    assert reserve(client, visitor, reserved["id"]).status_code == 201
    return {
        "owner": owner,
        "owner_headers": auth_headers(owner["access_token"]),
        "visitor": visitor,
        "visitor2": visitor2,
        "slug": owner_slug(client, owner),
        "categories": [essentials, clothes],
        "reserved": reserved,
        "free": free,
        "hidden": hidden,
    }


def secrets_of(world: dict) -> list[str]:
    values = []
    for key in ("visitor", "visitor2"):
        user = world[key]["user"]
        values += [user["id"], user["email"], user["display_name"]]
    return values


def assert_no_leak(text: str, world: dict) -> None:
    lowered = text.lower()
    for marker in FORBIDDEN_MARKERS:
        assert marker not in lowered, f"marker {marker!r} found in owner-facing response: {text[:200]}"
    for secret in secrets_of(world):
        assert secret.lower() not in lowered, f"visitor data {secret!r} found in owner-facing response"
