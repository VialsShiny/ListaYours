import asyncio
import logging
import threading
import time
from typing import Any

import httpx
from playwright.async_api import Error as PlaywrightError

from app.config import get_settings
from app.scraper.engine import scrape_product
from app.services.errors import ServiceError
from app.utils.url_safety import UnsafeUrl, assert_public_http_url

logger = logging.getLogger("scrape_service")


MAX_CACHE_ENTRIES = 256
TRANSIENT_ERRORS = (httpx.TransportError, PlaywrightError)


class ScrapeCache:
    """Tiny TTL cache so repeated requests for the same product do not re-launch Chromium."""

    def __init__(self) -> None:
        self._entries: dict[tuple[str, str], tuple[float, dict[str, Any], str]] = {}
        self._lock = threading.Lock()

    def get(self, key: tuple[str, str]) -> tuple[dict[str, Any], str] | None:
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            expires_at, data, strategy = entry
            if expires_at < time.monotonic():
                del self._entries[key]
                return None
            return data, strategy

    def put(self, key: tuple[str, str], data: dict[str, Any], strategy: str, ttl: float) -> None:
        now = time.monotonic()
        with self._lock:
            expired = [k for k, (expires_at, _, _) in self._entries.items() if expires_at < now]
            for k in expired:
                del self._entries[k]
            if len(self._entries) >= MAX_CACHE_ENTRIES:
                self._entries.pop(next(iter(self._entries)))
            self._entries[key] = (now + ttl, data, strategy)

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()


cache = ScrapeCache()


class ScrapeTimeout(Exception):
    pass


def validate_url(url: str) -> None:
    try:
        assert_public_http_url(url)
    except UnsafeUrl as error:
        raise ServiceError(str(error), 400) from error


async def _scrape_with_one_retry(url: str, strategy: str, debug: bool) -> tuple[dict[str, Any], str]:
    try:
        return await scrape_product(url, strategy, debug)
    except TRANSIENT_ERRORS:
        logger.warning("Transient scrape failure for %s, retrying once", url)
        return await scrape_product(url, strategy, debug)


async def scrape_with_guards(url: str, strategy: str, debug: bool) -> tuple[dict[str, Any], str]:
    """Run the unchanged scraper behind SSRF validation, a cache, one retry on transport errors and one hard timeout."""
    settings = get_settings()
    await asyncio.to_thread(validate_url, url)
    key = (url, strategy)
    if not debug:
        cached = cache.get(key)
        if cached is not None:
            return cached
    try:
        data, used = await asyncio.wait_for(
            _scrape_with_one_retry(url, strategy, debug), settings.scrape_timeout_seconds
        )
    except TimeoutError as error:
        raise ScrapeTimeout(f"Délai dépassé ({settings.scrape_timeout_seconds:.0f}s) pour {url}") from error
    canonical = data.get("canonical_url")
    if canonical and canonical != url:
        await asyncio.to_thread(validate_url, canonical)
    if not debug:
        cache.put(key, data, used, settings.scrape_cache_ttl_seconds)
    return data, used
