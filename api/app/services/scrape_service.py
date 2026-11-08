import asyncio
import logging
import threading
import time
from typing import Any

from app.config import get_settings
from app.scraper.engine import scrape_product
from app.services.errors import ServiceError
from app.utils.url_safety import UnsafeUrl, assert_public_http_url

logger = logging.getLogger("scrape_service")


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
        with self._lock:
            self._entries[key] = (time.monotonic() + ttl, data, strategy)

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


async def scrape_with_guards(url: str, strategy: str, debug: bool) -> tuple[dict[str, Any], str]:
    """Run the unchanged scraper behind a cache, a single retry on transient failure and a hard timeout."""
    settings = get_settings()
    key = (url, strategy)
    if not debug:
        cached = cache.get(key)
        if cached is not None:
            return cached
    attempts = 0
    while True:
        attempts += 1
        try:
            data, used = await asyncio.wait_for(scrape_product(url, strategy, debug), settings.scrape_timeout_seconds)
        except TimeoutError as error:
            raise ScrapeTimeout(f"Délai dépassé ({settings.scrape_timeout_seconds:.0f}s) pour {url}") from error
        except Exception:
            if attempts >= 2:
                raise
            logger.warning("Scrape failed for %s, retrying once", url)
            continue
        if not debug:
            cache.put(key, data, used, settings.scrape_cache_ttl_seconds)
        return data, used
