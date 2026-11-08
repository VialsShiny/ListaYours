import uuid
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Category, Gift, Wishlist
from app.schemas.gift import GiftCreate, GiftUpdate
from app.services.errors import NotFound


def list_gifts(db: Session, wishlist: Wishlist, visible_only: bool = False) -> list[Gift]:
    query = select(Gift).where(Gift.wishlist_id == wishlist.id)
    if visible_only:
        query = query.where(Gift.is_visible.is_(True))
    return list(db.scalars(query.order_by(Gift.position, Gift.created_at)))


def get_gift(db: Session, wishlist: Wishlist, gift_id: uuid.UUID) -> Gift:
    gift = db.get(Gift, gift_id)
    if gift is None or gift.wishlist_id != wishlist.id:
        raise NotFound("Cadeau introuvable.")
    return gift


def _check_category(db: Session, wishlist: Wishlist, category_id: uuid.UUID | None) -> None:
    if category_id is None:
        return
    category = db.get(Category, category_id)
    if category is None or category.wishlist_id != wishlist.id:
        raise NotFound("Catégorie introuvable.")


def _apply(gift: Gift, changes: dict) -> None:
    for field, value in changes.items():
        if field in {"image_url", "purchase_url"} and value is not None:
            value = str(value)
        if isinstance(value, Decimal):
            value = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        setattr(gift, field, value)


def next_position(db: Session, wishlist: Wishlist) -> int:
    current_max = db.scalar(select(func.max(Gift.position)).where(Gift.wishlist_id == wishlist.id))
    return 0 if current_max is None else current_max + 1


def create_gift(db: Session, wishlist: Wishlist, payload: GiftCreate) -> Gift:
    _check_category(db, wishlist, payload.category_id)
    gift = Gift(wishlist_id=wishlist.id, position=next_position(db, wishlist))
    _apply(gift, payload.model_dump())
    db.add(gift)
    db.commit()
    db.refresh(gift)
    return gift


def update_gift(db: Session, wishlist: Wishlist, gift_id: uuid.UUID, payload: GiftUpdate) -> Gift:
    gift = get_gift(db, wishlist, gift_id)
    changes = payload.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _check_category(db, wishlist, changes["category_id"])
    _apply(gift, changes)
    db.commit()
    db.refresh(gift)
    return gift


def delete_gift(db: Session, wishlist: Wishlist, gift_id: uuid.UUID) -> None:
    """Delete a gift; dependent reservations cascade in the database and nothing about them is reported."""
    gift = get_gift(db, wishlist, gift_id)
    db.delete(gift)
    db.commit()


def reorder_gifts(db: Session, wishlist: Wishlist, ordered_ids: list[uuid.UUID]) -> list[Gift]:
    gifts = {gift.id: gift for gift in list_gifts(db, wishlist)}
    if set(ordered_ids) != set(gifts) or len(ordered_ids) != len(gifts):
        raise NotFound("La liste d'identifiants ne correspond pas aux cadeaux.")
    for position, gift_id in enumerate(ordered_ids):
        gifts[gift_id].position = position
    db.commit()
    return list_gifts(db, wishlist)
