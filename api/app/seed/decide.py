import re
from decimal import Decimal, InvalidOperation
from typing import Any

from app.seed.models import GiftOutcome, SeedGift

BLOCKED_TITLE = re.compile(
    r"\brobot\b|\bcaptcha\b|^oops\b|something went wrong|access denied|une erreur|page introuvable|service unavailable",
    re.IGNORECASE,
)
CURRENCY_CODE = re.compile(r"^[A-Z]{3}$")
MAX_TITLE_IN_DESCRIPTION = 160
MAX_IMAGE_URL_LENGTH = 2048


def is_blocked(data: dict[str, Any] | None) -> bool:
    """A page counts as blocked when the scraper got no title, or an error-page title and no price."""
    if not data or not data.get("title"):
        return True
    return bool(BLOCKED_TITLE.search(str(data["title"]))) and not data.get("price")


def to_money(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None
    return amount if amount > 0 else None


def first_usable_image(images: Any) -> str | None:
    for image in images or []:
        if isinstance(image, str) and image.startswith(("http://", "https://")) and len(image) <= MAX_IMAGE_URL_LENGTH:
            return image
    return None


def decide(gift: SeedGift, data: dict[str, Any] | None, assets_base_url: str, skipped: bool = False) -> GiftOutcome:
    """Scraper values win when complete (price + ISO currency); the PDF price and image are the fallback."""
    outcome = GiftOutcome(name=gift.name, url=gift.url, source="scraper", price=None, currency="EUR", image=None)
    blocked = not skipped and is_blocked(data)
    scraped: dict[str, Any] = {} if (blocked or skipped) else (data or {})
    outcome.scraped_title = scraped.get("title")
    if skipped:
        outcome.flags.append("scrape_skipped")
    elif blocked:
        outcome.flags.append("blocked")

    price = to_money(scraped.get("price"))
    currency = str(scraped.get("currency") or "").strip().upper()
    if price is not None and CURRENCY_CODE.match(currency):
        outcome.price, outcome.currency = price, currency
        old_price = to_money(scraped.get("old_price"))
        outcome.old_price = old_price if old_price is not None and old_price > price else None
    else:
        outcome.price, outcome.currency, outcome.source = gift.pdf_price, "EUR", "pdf"
        if not skipped:
            outcome.flags.append("pdf_price" if price is None else "pdf_price_currency_unknown")

    if gift.pdf_image:
        outcome.image = f"{assets_base_url.rstrip('/')}/seed/{gift.pdf_image}"
        outcome.flags.append("pdf_image")
    else:
        outcome.image = first_usable_image(scraped.get("images"))
        if outcome.image is None:
            outcome.flags.append("no_image")
    return outcome


def build_description(gift: SeedGift, outcome: GiftOutcome) -> str:
    lines = []
    if gift.note:
        lines.append(gift.note)
    if gift.alt:
        lines.append(gift.alt)
    if outcome.scraped_title:
        title = outcome.scraped_title.strip()
        if len(title) > MAX_TITLE_IN_DESCRIPTION:
            title = title[: MAX_TITLE_IN_DESCRIPTION - 1].rstrip() + "…"
        lines.append(f"Produit : {title}")
    return "\n".join(lines)
