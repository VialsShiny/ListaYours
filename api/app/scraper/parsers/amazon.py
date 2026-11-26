import json
import logging
import re
from typing import Dict, Any
from bs4 import BeautifulSoup
from app.scraper.utils.text import clean_text
from app.scraper.utils.parsing import parse_price
from app.scraper.parsers.amazon_images import _extract_images

logger = logging.getLogger("TEST AMAZON")

def _extract_variant_value(li, dimension: str) -> str:
    """Extract variant value from list item."""
    value = None
    
    if dimension == "color":
        img = li.select_one("img.swatch-image[alt]")
        if img:
            value = clean_text(img.get("alt"))
    
    if not value:
        text = li.select_one(".swatch-title-text-display")
        if text:
            value = clean_text(text.get_text())
    
    return value

def _extract_variants(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract product variants (size, color, etc.)."""

    for ul in soup.select("ul[data-a-button-group]"):
        try:
            dimension = json.loads(ul["data-a-button-group"]).get("name", "")
        except Exception:
            continue

        dimension = dimension.lower().removesuffix("_name")

        if dimension not in product_info["variants"]:
            continue

        locked_fields.add(f"variants.{dimension}")
        target = product_info["variants"][dimension]

        for li in ul.select("li[data-asin]"):
            value = _extract_variant_value(li, dimension)
            if value and value not in target:
                target.append(value)

def _extract_category(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract product category."""
    category_block = soup.select_one("div[data-category]")
    if not category_block:
        return

    first_li = category_block.select_one("ul > li")
    if not first_li:
        return

    category = first_li.select_one("a .nav-a-content")
    if category:
        product_info['category'] = clean_text(category.get_text())
        locked_fields.add("category")

def _parse_rating(rating_alt) -> float:
    """Parse rating value from text."""
    if not rating_alt:
        return None
    raw_rating = clean_text(rating_alt.get_text())
    rating_str = raw_rating.split(" sur ")[0].replace(",", ".")
    try:
        return float(rating_str)
    except ValueError:
        return None

def _parse_review_count(review_text) -> int:
    """Parse review count from text."""
    if not review_text:
        return None
    review_count_str = "".join(filter(str.isdigit, review_text.get_text()))
    try:
        return int(review_count_str) if review_count_str else None
    except ValueError:
        return None

def _extract_reviews(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract review rating and count."""
    review_block = soup.select_one("#averageCustomerReviews")
    if not review_block:
        return

    rating_alt = review_block.select_one(".a-icon-alt")
    product_info["reviews"]["rating_average"] = _parse_rating(rating_alt)

    review_text = review_block.select_one("#acrCustomerReviewText")
    product_info["reviews"]["review_count"] = _parse_review_count(review_text)
    locked_fields.add("reviews")

def _extract_title(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """The product title node, instead of the <meta name=title> that carries the ' : Amazon.fr: ...' suffix."""
    node = soup.select_one("#productTitle")
    if node and clean_text(node.get_text()):
        product_info["title"] = clean_text(node.get_text())
        locked_fields.add("title")

PRICE_BLOCK = "#corePriceDisplay_desktop_feature_div, #corePrice_feature_div, #corePrice_desktop, #apex_desktop"
CURRENCIES = (("€", "EUR"), ("EUR", "EUR"), ("$", "USD"), ("USD", "USD"), ("£", "GBP"), ("¥", "JPY"))

def _extract_price(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Price to pay and list price from the buy box; no buy box (unavailable, undeliverable) means no price."""
    block = soup.select_one(PRICE_BLOCK)
    if block is None:
        return
    locked_fields.update({"price", "old_price", "discount"})
    pay = block.select_one(".apex-pricetopay-value, .priceToPay")
    offscreen = pay.select_one(".a-offscreen") if pay else None
    text = clean_text(offscreen.get_text() if offscreen and offscreen.get_text().strip() else pay.get_text("")) if pay else ""
    product_info["price"] = parse_price(text) if text else None
    basis = soup.select_one(".apex-basisprice-value .a-offscreen, .basisPrice .a-offscreen")
    product_info["old_price"] = parse_price(clean_text(basis.get_text())) if basis and product_info["price"] else None
    product_info["currency"] = next((code for symbol, code in CURRENCIES if symbol in text), product_info["currency"])

def _extract_description(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """The feature bullets are the product description a reader sees; the meta description is SEO boilerplate."""
    bullets = [clean_text(li.get_text(" ")) for li in soup.select("#feature-bullets li, #productDescription p")]
    if any(bullets):
        product_info["description"] = " ".join(bullet for bullet in bullets if bullet)
        locked_fields.add("description")

BYLINE_NOISE = re.compile(r"^(Visit the |Visiter la boutique |Besuche den |Brand: |Marque : |Marke: )|( Store|-Store)$")
UNAVAILABLE = re.compile(r"(?i)indisponible|unavailable|cannot be shipped|kann nicht|nicht verfügbar")
IN_STOCK = re.compile(r"(?i)stock|lager|available|disponible")

def _extract_brand(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Brand row of the overview table, else the byline ('Visit the X Store' in every locale)."""
    row = soup.select_one("tr.po-brand td.a-span9")
    byline = soup.select_one("#bylineInfo")
    brand = clean_text(row.get_text()) if row else BYLINE_NOISE.sub("", clean_text(byline.get_text()) or "") if byline else ""
    if brand:
        product_info["brand"] = brand
        locked_fields.add("brand")

def _extract_stock(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """The availability box wins over the buy-button heuristic, whose keywords are French and English only."""
    box = soup.select_one("#availability")
    if box is None:
        return
    text = clean_text(box.get_text(" ")) or ""
    available = not UNAVAILABLE.search(text) and (bool(soup.select_one("#add-to-cart-button")) or bool(IN_STOCK.search(text)))
    product_info["availability"] = available
    product_info["stock"] = "InStock" if available else "OutOfStock"
    locked_fields.add("stock")

def _extract_sku(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract ASIN/SKU identifier."""
    asin_block = soup.select_one("[data-asin]")
    if asin_block:
        asin = asin_block.get("data-asin")
        if asin and not product_info.get('sku'):
            product_info['sku'] = asin
            locked_fields.add("sku")

def amazon_parsers(
    product_info: Dict[str, Any], 
    soup: BeautifulSoup, 
    base_url: str
) -> set[str]:
    """Parse Amazon product information and return temporary lock fields."""
    locked_fields: set[str] = set()

    _extract_title(soup, product_info, locked_fields)
    _extract_price(soup, product_info, locked_fields)
    _extract_description(soup, product_info, locked_fields)
    _extract_brand(soup, product_info, locked_fields)
    _extract_stock(soup, product_info, locked_fields)
    _extract_images(soup, product_info, base_url, locked_fields)
    _extract_variants(soup, product_info, locked_fields)
    _extract_category(soup, product_info, locked_fields)
    _extract_reviews(soup, product_info, locked_fields)
    _extract_sku(soup, product_info, locked_fields)
    return locked_fields