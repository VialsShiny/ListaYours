import re
from typing import Dict, Any
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from app.scraper.utils.text import clean_text
from app.scraper.utils.parsing import parse_price, parse_rating, parse_count
import logging

logger = logging.getLogger("TEST ALIEXPRESS")

def _extract_images(soup: BeautifulSoup, product_info: Dict[str, Any], base_url: str, locked_fields: set[str] | None = None) -> None:
    """Extract and process product gallery images."""
    gallery = product_info.get("gallery")
    if gallery is None:
        product_info["gallery"] = []
        gallery = product_info["gallery"]

    handled_images = False

    image_selectors = [
        ".slider--item--RpyeewA img[src]",
        ".main-image--wrap--nFuR5UU img[src]",
        '[class^="slider--item--"] img[src]',
        '[class^="main-image--wrap--"] img[src]',
    ]

    seen = set(gallery)

    for selector in image_selectors:
        for img in soup.select(selector):
            img_src = img.get("src")
            if not img_src or img_src.startswith("data:"):
                continue

            full_url = urljoin(base_url, img_src)
            if full_url not in seen:
                gallery.append(full_url)
                seen.add(full_url)
                handled_images = True

    if handled_images or gallery:
        locked_fields.add("images")

        if not product_info.get("images") and gallery:
            product_info["images"] = gallery[:2]

def _extract_title(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract product title."""
    title_tag = soup.select_one('h1[data-pl="product-title"]')

    if not title_tag:
        title_tag = soup.select_one("h1")

    if not title_tag:
        return

    title = clean_text(title_tag.get_text(" ", strip=True))
    if title:
        product_info["title"] = title
        locked_fields.add("title")
        
def _extract_price(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract current product price."""
    price_tag = soup.select_one(".price-default--current--F8OlYIo")

    if not price_tag:
        price_tag = soup.select_one('[class*="price-default--current"]')

    if not price_tag:
        return

    price = parse_price(price_tag.get_text(" ", strip=True))
    if price is None:
        return

    product_info["price"] = price
    locked_fields.add("price")

def _extract_old_price(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract a previous price when present."""
    if product_info.get("old_price"):
        return

    old_price_elements = soup.select_one(
        ".price-default--original--CWcHOit, [class^=\"price-default--original--\"]"
    )
    if old_price_elements:
        parsed_old = parse_price(old_price_elements.get_text())
        if parsed_old and parsed_old != product_info.get("price"):
            product_info["old_price"] = parsed_old
            if locked_fields is not None:
                locked_fields.add("old_price")
            return

def _extract_reviews(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract product rating, review count and sold count."""
    reviewer_block = soup.select_one('[data-pl="product-reviewer"]')
    if not reviewer_block:
        reviewer_block = soup.select_one(".reviewer--wrap--vGS7G6P")

    if not reviewer_block:
        return

    review_data = product_info.setdefault("reviews", {})

    rating_text = reviewer_block.select_one('a[href="#nav-review"] strong')
    rating = parse_rating(rating_text.get_text(" ", strip=True)) if rating_text else None

    if rating is None:
        rating_tag = reviewer_block.select_one(
            ".rating--top--hpJ_aL4, [class^=\"rating--top--\"]"
        )
    else:
        rating_tag = None

    if rating_tag:
        style = rating_tag.get("style", "")
        width_match = re.search(r"width:\s*(\d+)%", style)

        if width_match:
            width = int(width_match.group(1))
            rating = round(width / 20, 2)
        else:
            parent_text = reviewer_block.get_text(" ", strip=True)
            rating = parse_rating(parent_text)

    if rating is not None:
        review_data["rating_average"] = rating

    review_link = reviewer_block.select_one('a[href="#nav-review"]')
    if review_link:
        review_text = clean_text(review_link.get_text(" ", strip=True))
        review_count = parse_count(review_text)

        if review_count is not None:
            review_data["review_count"] = review_count

    if review_data:
        locked_fields.add("reviews")

def _extract_product_id(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract AliExpress product identifier."""
    product_id = None

    coupon_block = soup.select_one('.coupon-block--wrap--me8R7bX[ae_object_value]')
    if coupon_block:
        product_id = coupon_block.get("ae_object_value")

    if not product_id:
        report_link = soup.select_one('a[href*="/complaint/report?itemUrl="]')
        if report_link:
            href = report_link.get("href", "")
            match = re.search(r"/item/(\d+)\.html", href)
            if match:
                product_id = match.group(1)

    if product_id and not product_info.get("sku"):
        product_info["sku"] = product_id
        locked_fields.add("sku")

def _extract_variants(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract available AliExpress product variants."""
    variants = product_info.get("variants")
    if not isinstance(variants, dict):
        return

    variant_mapping = {
        "default": "pattern",
        "couleur": "color",
        "color": "color",
        "rom": "size",
        "stockage": "size",
        "mémoire vive": "style",
        "ram": "style",
        "version": "pattern",
    }

    for property_block in soup.select(
        '.sku-item--property--HuasaIz, [class^="sku-item--property--"]'
    ):
        title_tag = property_block.select_one(
            '.sku-item--title--Z0HLO87, [class^="sku-item--title--"]'
        )
        if not title_tag:
            continue

        title_text = clean_text(title_tag.get_text(" ", strip=True))
        dimension = title_text.partition(":")[0]
        dimension = dimension.strip().lower()

        target_key = variant_mapping.get(dimension, "default")

        target = variants.setdefault(target_key, [])
        if not isinstance(target, list):
            continue

        for sku in property_block.select("[data-sku-col]"):
            if "sku-item--soldOut--" in " ".join(sku.get("class", [])):
                continue

            img = sku.select_one("img[alt]")
            if img:
                value = clean_text(img.get("alt"))
            else:
                value = clean_text(sku.get("title") or sku.get_text(" ", strip=True))

            if value and value not in target:
                target.append(value)

        if target:
            locked_fields.add(f"variants.{target_key}")

def _extract_characteristics(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract key/value characteristics from tables or definition lists."""
    characteristics = product_info.get("characteristics")
    if not isinstance(characteristics, dict):
        characteristics = {}
        product_info["characteristics"] = characteristics
        
    specification_block = soup.select_one('[data-pl="product-specs"]')
    if specification_block is None:
        specification_block = soup.select_one("#nav-specification")
    specification_root = specification_block or soup

    for property_block in specification_root.select(
        '.specification--prop--Jh28bKu, [class^="specification--prop--"]'
    ):
        title = property_block.select_one(
            '.specification--title--SfH3sA8, [class^="specification--title--"]'
        )
        description = property_block.select_one(
            '.specification--desc--Dxx6W0W, [class^="specification--desc--"]'
        )
        if not title or not description:
            continue

        key = clean_text(title.get_text(" ", strip=True))
        value = clean_text(description.get("title") or description.get_text(" ", strip=True))
        if key and value:
            characteristics[key] = value

    store_table = soup.select_one(
        '.store-detail--storeInfo--BMDFsTB table, [class^="store-detail--storeInfo--"] table'
    )
    if store_table:
        for index, row in enumerate(store_table.select("tr")):
            cells = row.select("th, td")
            if len(cells) < 2:
                continue

            value = clean_text(cells[1].get_text())
            if not value:
                continue

            label = "Nom de la Boutique" if index == 0 else clean_text(cells[0].get_text()).rstrip(":")
            if label:
                characteristics[label] = value

    if characteristics and locked_fields is not None:
        locked_fields.add("characteristics")

def _extract_brand(soup: BeautifulSoup, product_info: Dict[str, Any], locked_fields: set[str] | None = None) -> None:
    """Extract product brand."""
    brand_block = soup.select_one(".description--brandPlusTitle--Umuqmu_")
    if not brand_block:
        return

    brand_text = clean_text(brand_block.get_text(" ", strip=True))

    match = re.search(r"SAMSUNG|APPLE|XIAOMI|HONOR|HUAWEI|ONEPLUS|OPPO|REALME", brand_text, flags=re.IGNORECASE)

    if match:
        brand = match.group(0)
    else:
        brand = brand_text.split(":", 1)[-1].strip()

    if brand:
        product_info["brand"] = brand
        locked_fields.add("brand")
        
def _extract_discount(product_info: Dict[str, Any]) -> None:
    """Calculate a discount percentage when possible."""
    if product_info.get("discount") or not product_info.get("price") or not product_info.get("old_price"):
        return

    try:
        p_float = float(product_info["price"])
        op_float = float(product_info["old_price"])
        if op_float > p_float:
            pct = round(((op_float - p_float) / op_float) * 100)
            product_info["discount"] = f"-{pct}%"
    except (TypeError, ValueError):
        pass

def aliexpress_parsers(product_info: Dict[str, Any], soup: BeautifulSoup, base_url: str) -> set[str]:
    """Parse AliExpress product information and return temporary lock fields."""
    locked_fields: set[str] = set()

    _extract_images(soup, product_info, base_url, locked_fields)
    _extract_title(soup, product_info, locked_fields)
    _extract_price(soup, product_info, locked_fields)
    _extract_old_price(soup, product_info, locked_fields)
    _extract_reviews(soup, product_info, locked_fields)
    _extract_product_id(soup, product_info, locked_fields)
    _extract_variants(soup, product_info, locked_fields)
    _extract_brand(soup, product_info, locked_fields)
    _extract_characteristics(soup, product_info, locked_fields)
    _extract_discount(product_info)

    return locked_fields