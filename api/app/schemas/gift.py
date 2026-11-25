import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationInfo,
    field_serializer,
    field_validator,
)

from app.schemas.category import CategoryOut
from app.schemas.common import BoundedUrl
from app.schemas.wishlist import WishlistOut

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
CURRENCY_PATTERN = re.compile(r"^[A-Z]{3}$")


def check_currency(value: str) -> str:
    """Runs after upper-casing, so `usd` is accepted as `USD` while digits or accents are refused."""
    if not CURRENCY_PATTERN.fullmatch(value):
        raise ValueError("La devise doit être un code de trois lettres, par exemple EUR.")
    return value


Currency = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True), AfterValidator(check_currency)]
Money = Annotated[Decimal, Field(ge=0, lt=100_000_000)]


class GiftBase(BaseModel):
    name: Name
    description: str = Field(default="", max_length=4000)
    image_url: BoundedUrl | None = None
    price: Money | None = None
    old_price: Money | None = None
    currency: Currency = "EUR"
    purchase_url: BoundedUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool = True


class GiftCreate(GiftBase):
    pass


class GiftUpdate(BaseModel):
    """Partial update: omitted fields are untouched; explicit null is only allowed on nullable columns."""

    name: Name | None = None
    description: str | None = Field(default=None, max_length=4000)
    image_url: BoundedUrl | None = None
    price: Money | None = None
    old_price: Money | None = None
    currency: Currency | None = None
    purchase_url: BoundedUrl | None = None
    category_id: uuid.UUID | None = None
    is_visible: bool | None = None

    @field_validator("name", "description", "currency", "is_visible", mode="before")
    @classmethod
    def required_fields_cannot_be_null(cls, value: Any, info: ValidationInfo) -> Any:
        if value is None:
            raise ValueError(f"Le champ {info.field_name} ne peut pas être vide.")
        return value


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
