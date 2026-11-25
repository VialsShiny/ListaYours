import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Gift, Reservation, User, Wishlist
from app.services.db import commit_or_conflict
from app.services.errors import NotFound
from app.services.gift_service import GIFT_NOT_FOUND

ALREADY_RESERVED = "Ce cadeau est déjà réservé."
NOTHING_TO_CANCEL = "Aucune réservation à annuler pour ce cadeau."


def _reservable_gift(db: Session, gift_id: uuid.UUID) -> Gift:
    gift = db.get(Gift, gift_id)
    if gift is None or not gift.is_visible:
        raise NotFound(GIFT_NOT_FOUND)
    wishlist = db.get(Wishlist, gift.wishlist_id)
    if wishlist is None or not wishlist.is_published:
        raise NotFound(GIFT_NOT_FOUND)
    return gift


def reserve_gift(db: Session, visitor: User, gift_id: uuid.UUID) -> Reservation:
    """Insert the reservation inside one transaction; the UNIQUE(gift_id) constraint settles any race."""
    _reservable_gift(db, gift_id)
    reservation = Reservation(gift_id=gift_id, visitor_id=visitor.id)
    db.add(reservation)
    commit_or_conflict(db, ALREADY_RESERVED)
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, visitor: User, gift_id: uuid.UUID) -> None:
    reservation = db.scalar(
        select(Reservation).where(Reservation.gift_id == gift_id, Reservation.visitor_id == visitor.id)
    )
    if reservation is None:
        raise NotFound(NOTHING_TO_CANCEL)
    db.delete(reservation)
    db.commit()


def list_my_reservations(db: Session, visitor: User) -> list[tuple[Reservation, Gift, Wishlist]]:
    """The caller's reservations on gifts that are still public: hidden gifts and unpublished lists are left out."""
    rows = db.execute(
        select(Reservation, Gift, Wishlist)
        .join(Gift, Gift.id == Reservation.gift_id)
        .join(Wishlist, Wishlist.id == Gift.wishlist_id)
        .where(
            Reservation.visitor_id == visitor.id,
            Gift.is_visible.is_(True),
            Wishlist.is_published.is_(True),
        )
        .order_by(Reservation.created_at.desc())
    )
    return [(reservation, gift, wishlist) for reservation, gift, wishlist in rows]


def reserved_gift_ids(db: Session, gift_ids: list[uuid.UUID]) -> dict[uuid.UUID, uuid.UUID]:
    if not gift_ids:
        return {}
    rows = db.execute(select(Reservation.gift_id, Reservation.visitor_id).where(Reservation.gift_id.in_(gift_ids)))
    return {gift_id: visitor_id for gift_id, visitor_id in rows}
