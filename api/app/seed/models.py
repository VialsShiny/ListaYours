import json
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path


@dataclass(frozen=True)
class SeedGift:
    category: str
    name: str
    pdf_price: Decimal
    url: str
    note: str | None = None
    alt: str | None = None
    pdf_image: str | None = None


@dataclass(frozen=True)
class SeedWishlist:
    title: str
    slug: str
    description: str
    categories: list[str]
    gifts: list[SeedGift]


@dataclass
class GiftOutcome:
    name: str
    url: str
    source: str
    price: Decimal | None
    currency: str
    image: str | None
    old_price: Decimal | None = None
    flags: list[str] = field(default_factory=list)
    scraped_title: str | None = None


def load_seed(path: Path) -> SeedWishlist:
    raw = json.loads(path.read_text(encoding="utf-8"))
    gifts = [
        SeedGift(
            category=item["category"],
            name=item["name"],
            pdf_price=Decimal(str(item["pdf_price"])),
            url=item["url"],
            note=item.get("note"),
            alt=item.get("alt"),
            pdf_image=item.get("pdf_image"),
        )
        for item in raw["gifts"]
    ]
    return SeedWishlist(
        title=raw["title"],
        slug=raw["slug"],
        description=raw.get("description", ""),
        categories=list(raw["categories"]),
        gifts=gifts,
    )
