import asyncio
import logging
import os
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ROLE_OWNER, Category, Gift, User, Wishlist
from app.seed.decide import build_description, decide, old_price_of
from app.seed.models import GiftOutcome, SeedGift, SeedWishlist
from app.services.auth_service import hash_password
from app.services.scrape_service import scrape_with_guards

logger = logging.getLogger("seed")


def ensure_owner(db: Session, email: str, password: str | None) -> User:
    """Reuse the owner account when it exists; otherwise create it from OWNER_PASSWORD (never logged)."""
    owner = db.scalar(select(User).where(User.email == email))
    if owner is not None:
        return owner
    if not password:
        raise RuntimeError("OWNER_PASSWORD is required to create the owner account")
    owner = User(email=email, password_hash=hash_password(password), display_name="Thibault", role=ROLE_OWNER)
    db.add(owner)
    db.flush()
    return owner


def ensure_wishlist(db: Session, owner: User, seed: SeedWishlist) -> Wishlist:
    wishlist = db.scalar(select(Wishlist).where(Wishlist.owner_id == owner.id))
    if wishlist is None:
        wishlist = Wishlist(owner_id=owner.id)
        db.add(wishlist)
    wishlist.title = seed.title
    wishlist.slug = seed.slug
    wishlist.description = seed.description
    wishlist.is_published = True
    db.flush()
    return wishlist


def ensure_categories(db: Session, wishlist: Wishlist, names: list[str]) -> dict[str, Category]:
    existing = {c.name: c for c in db.scalars(select(Category).where(Category.wishlist_id == wishlist.id))}
    for position, name in enumerate(names):
        category = existing.get(name)
        if category is None:
            category = Category(wishlist_id=wishlist.id, name=name)
            db.add(category)
            existing[name] = category
        category.position = position
    db.flush()
    return existing


async def scrape_or_none(url: str) -> dict[str, Any] | None:
    try:
        data, strategy = await scrape_with_guards(url, "HTTPX", False)
        logger.info("scraped %s via %s", url, strategy)
        return data
    except Exception as error:
        logger.warning("scrape failed for %s: %s", url, type(error).__name__)
        return None


def upsert_gift(
    db: Session, wishlist: Wishlist, category: Category, gift: SeedGift, outcome: GiftOutcome, position: int
) -> Gift:
    row = db.scalar(select(Gift).where(Gift.wishlist_id == wishlist.id, Gift.purchase_url == gift.url))
    if row is None:
        row = Gift(wishlist_id=wishlist.id, purchase_url=gift.url)
        db.add(row)
    row.category_id = category.id
    row.name = gift.name
    row.description = build_description(gift, outcome)
    row.image_url = outcome.image
    row.price = outcome.price
    row.old_price = old_price_of(outcome)
    row.currency = outcome.currency
    row.is_visible = True
    row.position = position
    db.flush()
    return row


async def run_seed(db: Session, seed: SeedWishlist, assets_base_url: str, scrape: bool = True) -> list[GiftOutcome]:
    owner = ensure_owner(db, os.environ["OWNER_EMAIL"].strip().lower(), os.environ.get("OWNER_PASSWORD"))
    wishlist = ensure_wishlist(db, owner, seed)
    categories = ensure_categories(db, wishlist, seed.categories)
    outcomes: list[GiftOutcome] = []
    for position, gift in enumerate(seed.gifts):
        data = await scrape_or_none(gift.url) if scrape else None
        outcome = decide(gift, data, assets_base_url)
        if not scrape:
            outcome.flags = [flag for flag in outcome.flags if flag != "blocked"] + ["scrape_skipped"]
        upsert_gift(db, wishlist, categories[gift.category], gift, outcome, position)
        outcomes.append(outcome)
        logger.info("%s -> %s %s %s", gift.name, outcome.source, outcome.price, outcome.currency)
    db.commit()
    return outcomes


def run_seed_sync(db: Session, seed: SeedWishlist, assets_base_url: str, scrape: bool = True) -> list[GiftOutcome]:
    return asyncio.run(run_seed(db, seed, assets_base_url, scrape))
