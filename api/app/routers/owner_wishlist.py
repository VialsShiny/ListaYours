from fastapi import APIRouter

from app.deps import DbSession, OwnerUser
from app.schemas.category import CategoryOut
from app.schemas.gift import OwnerGiftOut, OwnerWishlistOut
from app.schemas.wishlist import WishlistOut, WishlistUpdate
from app.services.category_service import list_categories
from app.services.gift_service import list_gifts
from app.services.wishlist_service import require_owner_wishlist, update_settings

router = APIRouter(prefix="/api/owner/wishlist", tags=["owner"])


@router.get("", response_model=OwnerWishlistOut)
def read_owner_wishlist(owner: OwnerUser, db: DbSession) -> OwnerWishlistOut:
    """The owner's full view: settings, categories and gifts, without any reservation data."""
    wishlist = require_owner_wishlist(db, owner)
    return OwnerWishlistOut(
        wishlist=WishlistOut.model_validate(wishlist),
        categories=[CategoryOut.model_validate(category) for category in list_categories(db, wishlist)],
        gifts=[OwnerGiftOut.model_validate(gift) for gift in list_gifts(db, wishlist)],
    )


@router.patch("", response_model=WishlistOut)
def update_owner_wishlist(payload: WishlistUpdate, owner: OwnerUser, db: DbSession) -> WishlistOut:
    wishlist = require_owner_wishlist(db, owner)
    return WishlistOut.model_validate(update_settings(db, wishlist, payload))
