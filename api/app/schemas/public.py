import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryOut
from app.schemas.gift import PublicGiftOut
from app.schemas.wishlist import WishlistSummary


class PublicWishlistOut(BaseModel):
    wishlist: WishlistSummary
    categories: list[CategoryOut]
    gifts: list[PublicGiftOut]
    reservations_visible: bool


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gift_id: uuid.UUID
    created_at: datetime


class MyReservationOut(BaseModel):
    reservation: ReservationOut
    gift: PublicGiftOut
    wishlist: WishlistSummary
