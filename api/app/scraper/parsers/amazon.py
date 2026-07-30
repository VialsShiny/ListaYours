import json
import logging
from typing import Dict, Any
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from app.scraper.utils.text import clean_text

logger = logging.getLogger("TEST AMAZON")

def _extract_images(soup: BeautifulSoup, product_info: Dict[str, Any], base_url: str) -> None:
    """Extract and process product images."""
    for img in soup.find_all('img'):
        img_src = img.get('data-old-hires')
        if not img_src or img_src.startswith('data:'):
            continue
            
        if ',' in img_src:
            img_src = img_src.split(',')[-1].strip().split(' ')[0]
            
        full_url = urljoin(base_url, img_src)
        if full_url not in product_info['gallery'] and not full_url.startswith('data:'):
            product_info['gallery'].append(full_url)

    if not product_info['images'] and product_info['gallery']:
        product_info['images'] = product_info['gallery'][:2]

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

def _extract_variants(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract product variants (size, color, etc.)."""
    for ul in soup.select("ul[data-a-button-group]"):
        try:
            dimension = json.loads(ul["data-a-button-group"]).get("name", "")
        except Exception:
            continue

        dimension = dimension.lower().removesuffix("_name")
        
        if dimension not in product_info["variants"]:
            continue

        target = product_info["variants"][dimension]
        
        for li in ul.select("li[data-asin]"):
            value = _extract_variant_value(li, dimension)
            if value and value not in target:
                target.append(value)

def _extract_category(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
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

def _extract_reviews(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract review rating and count."""
    review_block = soup.select_one("#averageCustomerReviews")
    if not review_block:
        return
    
    rating_alt = review_block.select_one(".a-icon-alt")
    product_info["reviews"]["rating_average"] = _parse_rating(rating_alt)
    
    review_text = review_block.select_one("#acrCustomerReviewText")
    product_info["reviews"]["review_count"] = _parse_review_count(review_text)

def _extract_sku(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract ASIN/SKU identifier."""
    asin_block = soup.select_one("[data-asin]")
    if asin_block:
        asin = asin_block.get("data-asin")
        if asin and not product_info.get('sku'):
            product_info['sku'] = asin

def amazon_parsers(
    product_info: Dict[str, Any], 
    soup: BeautifulSoup, 
    base_url: str
) -> None:	
    """Parse Amazon product information."""
    _extract_images(soup, product_info, base_url)
    _extract_variants(soup, product_info)
    _extract_category(soup, product_info)
    _extract_reviews(soup, product_info)
    _extract_sku(soup, product_info)
