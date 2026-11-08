from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User, Wishlist
from app.utils.slug import slugify

DEFAULT_TITLE = "Liste de Souhait"


def unique_slug(db: Session, base: str, exclude_id=None) -> str:
    slug = slugify(base)
    candidate = slug
    counter = 2
    while True:
        existing = db.scalar(select(Wishlist).where(Wishlist.slug == candidate))
        if existing is None or existing.id == exclude_id:
            return candidate
        candidate = f"{slug}-{counter}"
        counter += 1


def create_default_wishlist(db: Session, owner: User) -> Wishlist:
    wishlist = Wishlist(owner_id=owner.id, title=DEFAULT_TITLE, slug=unique_slug(db, DEFAULT_TITLE))
    db.add(wishlist)
    db.flush()
    return wishlist


def get_owner_wishlist(db: Session, owner: User) -> Wishlist | None:
    return db.scalar(select(Wishlist).where(Wishlist.owner_id == owner.id))


def get_wishlist_by_slug(db: Session, slug: str) -> Wishlist | None:
    return db.scalar(select(Wishlist).where(Wishlist.slug == slug))
