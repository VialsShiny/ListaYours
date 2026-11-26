"""Amazon product photos: only the image block, at the original resolution, in page order."""

import json
import re
from typing import Any, Dict
from urllib.parse import urljoin

from bs4 import BeautifulSoup

IMAGE_ENTRY = re.compile(r'"hiRes":(?:"([^"]+)"|null),"thumb":"[^"]*","large":"([^"]+)"')
SIZE_SUFFIX = re.compile(r"\._[^./]+_\.")
MAX_IMAGES = 8

def _dynamic_image_source(img) -> str | None:
    """First URL of an Amazon <img>: hi-res attribute, else a data-a-dynamic-image key, else src."""
    try:
        dynamic = list(json.loads(img.get("data-a-dynamic-image") or "{}"))
    except ValueError:
        dynamic = []
    return img.get("data-old-hires") or next(iter(dynamic), None) or img.get("src")

def _image_zone_sources(soup: BeautifulSoup):
    """Image URLs from the product image block only, in page order, best source first.

    Sources are tried in turn and the first one that yields anything wins, because the
    colorImages JSON, the main image <img> tags and the thumbnails all describe the same
    photos under different image ids and would otherwise pile up as near-duplicates.
    """
    for script in soup.find_all("script"):
        text = script.string or ""
        if "colorImages" in text:
            yield [hires or large for hires, large in IMAGE_ENTRY.findall(text)]
    block = soup.select_one("#imageBlock, #imageBlock_feature_div, #main-image-container, #landingImage")
    if block is not None:
        imgs = [block] if block.name == "img" else block.select("img[data-old-hires], img[data-a-dynamic-image], #landingImage")
        yield [_dynamic_image_source(img) for img in imgs]
    yield [img.get("src") for img in soup.select("#altImages img")]

def _extract_images(soup: BeautifulSoup, product_info: Dict[str, Any], base_url: str, locked_fields: set[str] | None = None) -> None:
    """Fill images and gallery with the product photos at their original resolution."""
    for sources in _image_zone_sources(soup):
        images: list[str] = []
        for url in sources:
            if not url or "/images/I/" not in url or url.startswith("data:"):
                continue
            original = SIZE_SUFFIX.sub(".", urljoin(base_url, url))
            if original not in images:
                images.append(original)
        if images:
            product_info["images"] = images[:MAX_IMAGES]
            product_info["gallery"] = list(product_info["images"])
            locked_fields.add("images")
            return
