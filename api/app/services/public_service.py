from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User, Wishlist
from app.schemas.gift import PublicGiftOut
from app.services.errors import NotFound
from app.services.gift_service import list_gifts
from app.services.reservation_service import reserved_gift_ids
from app.services.wishlist_service import get_wishlist_by_slug


def list_published(db: Session) -> list[Wishlist]:
    return list(db.scalars(select(Wishlist).where(Wishlist.is_published.is_(True)).order_by(Wishlist.created_at)))


def get_public_wishlist(db: Session, slug: str, viewer: User | None) -> Wishlist:
    wishlist = get_wishlist_by_slug(db, slug)
    if wishlist is None:
        raise NotFound("Liste introuvable.")
    is_owner = viewer is not None and viewer.id == wishlist.owner_id
    if not wishlist.is_published and not is_owner:
        raise NotFound("Liste introuvable.")
    return wishlist


def reservations_visible_to(wishlist: Wishlist, viewer: User | None) -> bool:
    """Only authenticated visitors who are not the owner may see reservation status."""
    return viewer is not None and viewer.id != wishlist.owner_id and not viewer.is_owner


def public_gifts(db: Session, wishlist: Wishlist, viewer: User | None) -> list[PublicGiftOut]:
    gifts = list_gifts(db, wishlist, visible_only=True)
    if not reservations_visible_to(wishlist, viewer):
        return [PublicGiftOut.model_validate(gift) for gift in gifts]
    reserved = reserved_gift_ids(db, [gift.id for gift in gifts])
    result = []
    for gift in gifts:
        out = PublicGiftOut.model_validate(gift)
        if gift.id in reserved:
            out.is_reserved = True
            out.reserved_by_me = viewer is not None and reserved[gift.id] == viewer.id
        result.append(out)
    return result
