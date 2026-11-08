import uuid

from fastapi import APIRouter, Response, status

from app.deps import DbSession, VisitorUser
from app.schemas.gift import PublicGiftOut
from app.schemas.public import MyReservationOut, ReservationOut
from app.schemas.wishlist import WishlistSummary
from app.services import reservation_service

router = APIRouter(prefix="/api", tags=["reservations"])


@router.post("/gifts/{gift_id}/reservation", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def reserve(gift_id: uuid.UUID, visitor: VisitorUser, db: DbSession) -> ReservationOut:
    return ReservationOut.model_validate(reservation_service.reserve_gift(db, visitor, gift_id))


@router.delete("/gifts/{gift_id}/reservation", status_code=status.HTTP_204_NO_CONTENT)
def cancel(gift_id: uuid.UUID, visitor: VisitorUser, db: DbSession) -> Response:
    reservation_service.cancel_reservation(db, visitor, gift_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/reservations", response_model=list[MyReservationOut])
def my_reservations(visitor: VisitorUser, db: DbSession) -> list[MyReservationOut]:
    items = []
    for reservation, gift, wishlist in reservation_service.list_my_reservations(db, visitor):
        gift_out = PublicGiftOut.model_validate(gift)
        gift_out.is_reserved = True
        gift_out.reserved_by_me = True
        items.append(
            MyReservationOut(
                reservation=ReservationOut.model_validate(reservation),
                gift=gift_out,
                wishlist=WishlistSummary.model_validate(wishlist),
            )
        )
    return items
