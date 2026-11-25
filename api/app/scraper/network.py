"""Network guards for the scraper: every hop (redirect, sub-resource) must target a public address."""

import asyncio
import logging
from urllib.parse import urljoin

import httpx
from playwright.async_api import BrowserContext, Page, Route

from app.utils.url_safety import UnsafeUrl, assert_public_http_url

logger = logging.getLogger("scraper_network")

MAX_REDIRECTS = 5
PASSTHROUGH_SCHEMES = ("data:", "blob:", "about:")


class BlockedRedirect(httpx.HTTPError):
    pass


async def assert_public(url: str) -> None:
    await asyncio.to_thread(assert_public_http_url, url)


async def get_following_safe_redirects(client: httpx.AsyncClient, url: str, headers: dict) -> httpx.Response:
    """GET with manual redirects: each Location is validated before being followed, at most MAX_REDIRECTS times."""
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        await assert_public(current)
        response = await client.get(current, headers=headers, follow_redirects=False)
        if not response.is_redirect:
            return response
        location = response.headers.get("location")
        if not location:
            return response
        current = urljoin(current, location)
    raise BlockedRedirect(f"Trop de redirections pour {url}")


async def guard_route(route: Route) -> None:
    """Playwright route handler: abort any request (navigation, redirect, XHR, image) to a non-public host."""
    url = route.request.url
    if url.startswith(PASSTHROUGH_SCHEMES):
        await route.continue_()
        return
    try:
        await assert_public(url)
    except UnsafeUrl:
        logger.warning("Blocked non-public request from the scraper: %s", url)
        await route.abort("blockedbyclient")
        return
    await route.continue_()


async def guard_context(target: BrowserContext | Page) -> None:
    await target.route("**/*", guard_route)


async def assert_landed_on_public_page(page: Page) -> None:
    """Belt and braces after navigation: the final URL (after redirects) must be public too."""
    try:
        await assert_public(page.url)
    except UnsafeUrl as error:
        raise BlockedRedirect(f"Page finale non autorisée : {page.url}") from error
