import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_serializer, field_validator

from app.schemas.category import CategoryOut
from app.schemas.wishlist import WishlistOut

MAX_URL_LENGTH = 2048
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Currency = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, min_length=3, max_length=3)]
Money = Annotated[Decimal, Field(ge=0, lt=100_000_000)]


def check_url_length(value: HttpUrl | None) -> HttpUrl | None:
    if value is not None and len(str(value)) > MAX_URL_LENGTH:
        raise ValueError(f"L'URL ne doit pas dépasser {MAX_URL_LENGTH} caractères.")
    return value


class GiftBase(BaseModel):
    name: Name
    description: str = Field(default="", max_length=4000)
    image_url: HttpUrl | None = None
    price: Money | None = None
    old_price: Money | None = None
    currency: Currency = "EUR"
    purchase_url: HttpUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool = True

    @field_validator("image_url", "purchase_url")
    @classmethod
    def urls_fit_the_column(cls, value: HttpUrl | None) -> HttpUrl | None:
        return check_url_length(value)


class GiftCreate(GiftBase):
    pass


class GiftUpdate(BaseModel):
    """Partial update: omitted fields are untouched; explicit null is only allowed on nullable columns."""

    name: Name | None = None
    description: str | None = Field(default=None, max_length=4000)
    image_url: HttpUrl | None = None
    price: Money | None = None
    old_price: Money | None = None
    currency: Currency | None = None
    purchase_url: HttpUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool | None = None

    @field_validator("name", "description", "currency", "is_visible", mode="before")
    @classmethod
    def required_fields_cannot_be_null(cls, value, info):
        if value is None:
            raise ValueError(f"Le champ {info.field_name} ne peut pas être vide.")
        return value

    @field_validator("image_url", "purchase_url")
    @classmethod
    def urls_fit_the_column(cls, value: HttpUrl | None) -> HttpUrl | None:
        return check_url_length(value)


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
