import inspect as python_inspect

from fastapi.routing import APIRoute
from pydantic import BaseModel
from sqlalchemy import UniqueConstraint
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Mapper

from app.db.models import Gift, Reservation, User, Wishlist
from app.deps import require_owner
from app.main import app
from app.schemas.gift import OwnerGiftOut, OwnerWishlistOut

OWNER_PREFIXES = ("/api/owner", "/api/scrape")


def owner_routes() -> list[APIRoute]:
    return [r for r in app.routes if isinstance(r, APIRoute) and r.path.startswith(OWNER_PREFIXES)]


def dependency_callables(dependant) -> set:
    found = set()
    stack = [dependant]
    while stack:
        current = stack.pop()
        for sub in current.dependencies:
            found.add(sub.call)
            stack.append(sub)
    return found


def field_names(model: type[BaseModel], seen: set | None = None) -> set[str]:
    seen = seen or set()
    names: set[str] = set()
    for name, field in model.model_fields.items():
        names.add(name)
        for candidate in _nested_models(field.annotation):
            if candidate not in seen:
                seen.add(candidate)
                names |= field_names(candidate, seen)
    return names


def _nested_models(annotation) -> list[type[BaseModel]]:
    models = []
    if python_inspect.isclass(annotation) and issubclass(annotation, BaseModel):
        models.append(annotation)
    for arg in getattr(annotation, "__args__", ()):
        models += _nested_models(arg)
    return models


def test_every_owner_route_requires_the_owner_role() -> None:
    routes = owner_routes()
    assert len(routes) >= 12
    for route in routes:
        assert require_owner in dependency_callables(route.dependant), route.path


def test_owner_response_models_have_no_reservation_fields() -> None:
    for route in owner_routes():
        model = route.response_model
        for candidate in _nested_models(model) if model is not None else []:
            for name in field_names(candidate):
                assert "reserv" not in name.lower(), (route.path, name)


def test_owner_gift_schema_is_an_explicit_whitelist() -> None:
    assert set(OwnerGiftOut.model_fields) == {
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
    assert "reserv" not in " ".join(field_names(OwnerWishlistOut)).lower()


def test_orm_never_loads_reservations_from_owner_entities() -> None:
    """Database-level isolation: no relationship from gifts, wishlists or users can lazy-load reservations."""
    for entity in (Gift, Wishlist, User):
        mapper: Mapper = sa_inspect(entity)
        targets = {rel.mapper.class_ for rel in mapper.relationships}
        assert Reservation not in targets, entity.__name__
    reservation_mapper: Mapper = sa_inspect(Reservation)
    assert list(reservation_mapper.relationships.keys()) == []
    table = Reservation.metadata.tables["reservations"]
    unique_columns = [
        tuple(c.name for c in constraint.columns)
        for constraint in table.constraints
        if isinstance(constraint, UniqueConstraint)
    ]
    assert ("gift_id",) in unique_columns
