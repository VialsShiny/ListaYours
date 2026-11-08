import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_serializer

from app.schemas.category import CategoryOut
from app.schemas.wishlist import WishlistOut


class GiftBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    image_url: HttpUrl | None = None
    price: Decimal | None = Field(default=None, ge=0, lt=100_000_000)
    old_price: Decimal | None = Field(default=None, ge=0, lt=100_000_000)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    purchase_url: HttpUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool = True


class GiftCreate(GiftBase):
    pass


class GiftUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    image_url: HttpUrl | None = None
    price: Decimal | None = Field(default=None, ge=0, lt=100_000_000)
    old_price: Decimal | None = Field(default=None, ge=0, lt=100_000_000)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    purchase_url: HttpUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool | None = None


class GiftCore(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category_id: uuid.UUID | None
    name: str
    description: str
    image_url: str | None
    price: Decimal | None
    old_price: Decimal | None
    currency: str
    purchase_url: str | None
    position: int

    @field_serializer("price", "old_price")
    def serialize_money(self, value: Decimal | None) -> str | None:
        return None if value is None else f"{value:.2f}"


class OwnerGiftOut(GiftCore):
    """What the owner sees: every gift field, and never anything about reservations."""

    is_visible: bool
    created_at: datetime
    updated_at: datetime


class PublicGiftOut(GiftCore):
    is_reserved: bool = False
    reserved_by_me: bool = False


class OwnerWishlistOut(BaseModel):
    wishlist: WishlistOut
    categories: list[CategoryOut]
    gifts: list[OwnerGiftOut]
