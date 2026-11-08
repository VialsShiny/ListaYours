from fastapi import APIRouter

from app.deps import DbSession, OptionalUser
from app.schemas.category import CategoryOut
from app.schemas.public import PublicWishlistOut
from app.schemas.wishlist import WishlistSummary
from app.services.category_service import list_categories
from app.services.public_service import get_public_wishlist, list_published, public_gifts, reservations_visible_to

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/wishlists", response_model=list[WishlistSummary])
def list_public_wishlists(db: DbSession) -> list[WishlistSummary]:
    return [WishlistSummary.model_validate(wishlist) for wishlist in list_published(db)]


@router.get("/wishlists/{slug}", response_model=PublicWishlistOut)
def read_public_wishlist(slug: str, db: DbSession, viewer: OptionalUser) -> PublicWishlistOut:
    """Public page data. Reservation status is attached only for authenticated visitors who are not the owner."""
    wishlist = get_public_wishlist(db, slug, viewer)
    return PublicWishlistOut(
        wishlist=WishlistSummary.model_validate(wishlist),
        categories=[CategoryOut.model_validate(category) for category in list_categories(db, wishlist)],
        gifts=public_gifts(db, wishlist, viewer),
        reservations_visible=reservations_visible_to(wishlist, viewer),
    )
