import logging
import re
from typing import Any, Dict
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from app.scraper.utils.text import clean_text
from app.scraper.utils.parsing import parse_price

logger = logging.getLogger("TEST DEFAULT")

def _extract_title(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract product title from a generic HTML page."""
    if product_info.get("title"):
        return

    for tag in soup.find_all(["h1", "h2"]):
        text = clean_text(tag.get_text())
        if not text:
            continue
        classes = " ".join(tag.get("class", []) or []).lower()
        if any(keyword in classes for keyword in ["product", "title", "name", "heading", "detail"]):
            product_info["title"] = text
            return

    h1_tag = soup.find("h1")
    if h1_tag:
        title = clean_text(h1_tag.get_text())
        if title:
            product_info["title"] = title
            return

    title_tag = soup.find("title")
    if title_tag:
        title = clean_text(title_tag.get_text())
        if title:
            product_info["title"] = title


def _extract_price(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract price from common selectors and text patterns."""
    if product_info["price"]:
        return

    attr_elements = soup.find_all(attrs={"data-testid": re.compile(r"(?i)(?:current)?price")})
    attr_elements += soup.find_all(attrs={"data-lu-target": re.compile(r"(?i)price")})

    for elem in attr_elements:
        testid = elem.get("data-testid", "")
        lutarget = elem.get("data-lu-target", "")
        marker = f"{testid} {lutarget}"
        if re.search(r"(?i)initial|original|old|was|strike|before|list|compare", marker):
            continue
        text = clean_text(elem.get_text())
        parsed = parse_price(text)
        if parsed:
            product_info["price"] = parsed
            for symbol, iso_code in [("€", "EUR"), ("$", "USD"), ("£", "GBP"), ("¥", "JPY")]:
                if symbol in text:
                    product_info["currency"] = product_info.get("currency") or iso_code
                    break
            return

    price_elements = soup.find_all(
        class_=re.compile(
            r"(?i)(?:\b(?:pricing|amount|money|cost|value|amt|currency|a-offscreen)\b|price(?:-(?:current|sale|special|regular|old|new|final|our|offer|discount|actual|item|value|box|wrapper|container|label|text)|__(?:\w+)|--(?:\w+))?)"
        )
    )

    for elem in price_elements:
        text = clean_text(elem.get_text())
        parsed = parse_price(text)
        if parsed:
            product_info["price"] = parsed
            for symbol, iso_code in [("€", "EUR"), ("$", "USD"), ("£", "GBP"), ("¥", "JPY")]:
                if symbol in text:
                    product_info["currency"] = product_info.get("currency") or iso_code
                    break
            return

    candidates = []
    excluded_tokens = ["sku", "stock", "review", "avis", "livraison", "retour"]

    for elem in soup.find_all(["span", "div", "p", "strong", "b", "td", "li"]):
        if elem.find(["span", "div", "p", "strong", "b", "td", "li"]):
            continue
        text = clean_text(elem.get_text())
        if not text or len(text) > 20:
            continue
        if any(token in text.lower() for token in excluded_tokens):
            continue
        parsed = parse_price(text)
        if parsed:
            candidates.append((text, parsed))

    if candidates:
        text, parsed = min(candidates, key=lambda c: len(c[0]))
        product_info["price"] = parsed

def _extract_old_price(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract a previous price when present."""
    if product_info.get("old_price"):
        return

    old_price_elements = soup.find_all(["del", "s"])
    if not old_price_elements:
        old_price_elements = soup.find_all(
            class_=re.compile(r"(apex-basisprice-value|old-price|compare-price|regular-price|list-price|strike|original-price)", re.I)
        )

    for elem in old_price_elements:
        parsed_old = parse_price(elem.get_text())
        if parsed_old and parsed_old != product_info.get("price"):
            product_info["old_price"] = parsed_old
            return


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

def _extract_stock_info(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    out_of_stock_keywords = ["rupture de stock", "épuisé", "out of stock"]
    buy_keywords = ["acheter", "ajouter au panier", "panier", "add to cart", "buy now", "sélectionner"]

    page_text = clean_text(soup.get_text()).lower()
    is_out_of_stock = any(k in page_text for k in out_of_stock_keywords)

    elements = soup.find_all("button") + soup.find_all("input", attrs={"type": "submit"})
    has_buy_button = False
    for el in elements:
        if el.has_attr("disabled") or el.get("aria-disabled") == "true" or el.get("tabindex") == "-1":
            continue
        text_el = clean_text(el.get_text() or el.get("value", ""))
        if any(k in text_el.lower() for k in buy_keywords):
            has_buy_button = True
            logger.warning(text_el)
            break

    has_stock = has_buy_button and not is_out_of_stock
    logger.warning(has_stock)

    product_info["stock"] = "InStock" if has_stock else "OutOfStock"
    product_info["availability"] = has_stock

def _extract_images(soup: BeautifulSoup, product_info: Dict[str, Any], base_url: str) -> None:
    """Extract and normalize images from a generic page."""
    for img in soup.find_all("img"):
        img_src = None

        for attr in ("product", "gallery", "carousel", "main", "featured", "zoom", "thumb"):
            value = img.get(attr)
            if value:
                img_src = value
                break

        if not img_src or img_src.startswith("data:"):
            continue

        if "," in img_src:
            candidates = []
            for part in img_src.split(","):
                part = part.strip().split(" ")[0]
                if part:
                    candidates.append(part)

            if candidates:
                img_src = candidates[-1]

        full_url = urljoin(base_url, img_src)

        if full_url not in product_info["gallery"]:
            product_info["gallery"].append(full_url)

    if not product_info["images"] and product_info["gallery"]:
        product_info["images"] = product_info["gallery"][:2]


def _extract_characteristics(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract key/value characteristics from tables or definition lists."""
    for container in soup.select("table, dl"):
        if container.name == "table":
            pairs = (
                (clean_text(cells[0].get_text()), clean_text(cells[1].get_text()))
                for row in container.select("tr")
                if len(cells := row.select("th, td")) >= 2
            )
        else:
            pairs = (
                (clean_text(dt.get_text()), clean_text(dd.get_text()))
                for dt, dd in zip(container.select("dt"), container.select("dd"))
            )

        for k, v in pairs:
            if not k or not v or len(k) > 80:
                continue

            product_info["characteristics"][k.rstrip(":")] = v

            key = "".join(c.lower() for c in k if c.isalnum())
            if key == "asin":
                product_info["sku"] = product_info.get("sku") or v
            elif not product_info.get("brand") and len(v) < 100:
                if "brand" in key or "mar" in key:
                    product_info["brand"] = v


def _extract_variants(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract size/color/style variants from generic selectors and button groups."""
    for ul in soup.select("ul[data-a-button-group]"):
        try:
            dimension = re.sub(r"_name$", "", (ul.get("data-a-button-group") or "").lower())
        except Exception:
            continue

        if dimension and dimension not in product_info["variants"]:
            continue

        target = product_info["variants"].get(dimension, [])
        for li in ul.select("li[data-asin]"):
            value = li.select_one(".swatch-title-text-display")
            text_value = clean_text(value.get_text()) if value else ""
            if text_value and text_value not in target:
                target.append(text_value)

    for sel in soup.find_all("select"):
        sel_id = (sel.get("id") or "").lower()
        sel_name = (sel.get("name") or "").lower()
        sel_class = " ".join(sel.get("class", []) or []).lower()

        is_size = any(keyword in sel_id or keyword in sel_name or keyword in sel_class for keyword in ["size", "taille", "format", "dimension"])
        is_color = any(keyword in sel_id or keyword in sel_name or keyword in sel_class for keyword in ["color", "couleur", "teinte", "pattern"])

        options = [clean_text(o.text) for o in sel.find_all("option") if o.get("value") and o.text and o.text.strip()]
        options = [option for option in options if option and not any(p in option.lower() for p in ["choisir", "sélectionner", "select", "choose"])]

        if options:
            if is_size:
                product_info["variants"]["size"].extend([option for option in options if option not in product_info["variants"]["size"]])
            elif is_color:
                product_info["variants"]["color"].extend([option for option in options if option not in product_info["variants"]["color"]])


def _extract_reviews(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract review information using common schema patterns."""
    if product_info["reviews"].get("rating_average") and product_info["reviews"].get("review_count"):
        return

    rating_tag = soup.select_one('[itemprop="ratingValue"], [itemprop="reviewRating"], .rating, .stars, [data-rating-value]')
    if rating_tag:
        rating_value = rating_tag.get("content") or rating_tag.get("data-rating-value") or rating_tag.get_text()
        if rating_value and not product_info["reviews"].get("rating_average"):
            parsed = parse_price(rating_value)
            if parsed:
                product_info["reviews"]["rating_average"] = parsed

    review_tag = soup.select_one('[itemprop="reviewCount"], .review-count, [data-review-count], #reviewCount')
    if review_tag:
        review_value = review_tag.get("content") or review_tag.get("data-review-count") or review_tag.get_text()
        if review_value and not product_info["reviews"].get("review_count"):
            review_count = re.sub(r"\D", "", str(review_value))
            if review_count:
                product_info["reviews"]["review_count"] = int(review_count)


def _extract_sku(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract SKU/ASIN from common attributes or text patterns."""
    if product_info.get("sku"):
        return

    for selector in ["[data-sku]", "[data-asin]", "[itemprop='sku']", "[itemprop=sku]", "#sku", "#asin"]:
        node = soup.select_one(selector)
        if node:
            value = node.get("data-sku") or node.get("data-asin") or node.get("content")
            if value:
                product_info["sku"] = clean_text(value)
                return

    for meta in soup.find_all("meta"):
        if meta.get("itemprop") == "sku" or meta.get("name") == "sku":
            value = meta.get("content")
            if value:
                product_info["sku"] = clean_text(value)
                return


def _extract_brand(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract brand from common markup."""
    if product_info.get("brand"):
        return

    for selector in ["[itemprop='brand']", "[itemprop=brand]", "[data-brand]", ".brand", ".product-brand"]:
        node = soup.select_one(selector)
        if node:
            value = clean_text(node.get_text())
            if value:
                product_info["brand"] = value
                return


def _extract_category(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract category from breadcrumb or data attributes."""
    if product_info.get("category"):
        return

    breadcrumb = soup.select_one(".breadcrumb, .breadcrumbs, nav[aria-label='breadcrumb']")
    if breadcrumb:
        items = [clean_text(item.get_text()) for item in breadcrumb.select("a, li") if clean_text(item.get_text())]
        if items:
            product_info["category"] = items[-1]
            return

    category_block = soup.select_one("div[data-category]")
    if category_block:
        first_li = category_block.select_one("ul > li")
        if first_li:
            category = first_li.select_one("a .nav-a-content")
            if category:
                product_info["category"] = clean_text(category.get_text())


def default_parsers(product_info: Dict[str, Any], soup: BeautifulSoup, base_url: str) -> None:
    """Parse product information with a generic and resilient fallback parser."""
    _extract_title(soup, product_info)
    _extract_price(soup, product_info)
    _extract_old_price(soup, product_info)
    _extract_discount(product_info)
    _extract_stock_info(soup, product_info)
    _extract_images(soup, product_info, base_url)
    _extract_characteristics(soup, product_info)
    _extract_variants(soup, product_info)
    _extract_reviews(soup, product_info)
    _extract_sku(soup, product_info)
    _extract_brand(soup, product_info)
    _extract_category(soup, product_info)