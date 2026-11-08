import asyncio
import dataclasses

import httpx
import pytest

from app.scraper.parser import extract_all_data
from app.services import scrape_service
from app.utils.url_safety import UnsafeUrl, assert_public_http_url
from tests.conftest import auth_headers

HTML = "<html><head><title>Produit</title></head><body><h1>Produit</h1><span class='price'>12,50 €</span></body></html>"


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/x",
        "http://localhost:8000/health",
        "http://127.0.0.1/",
        "http://[::1]/",
        "http://10.0.0.5/admin",
        "http://192.168.1.1/",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/",
        "http://api.internal/",
        "http://[::ffff:127.0.0.1]/",
    ],
)
def test_unsafe_urls_are_rejected(url) -> None:
    with pytest.raises(UnsafeUrl):
        assert_public_http_url(url)


def test_public_ip_literal_is_accepted() -> None:
    assert_public_http_url("https://1.1.1.1/")


def test_scrape_requires_owner(client, visitor) -> None:
    payload = {"url": "https://example.com/p"}
    assert client.post("/api/scrape", json=payload).status_code == 401
    assert client.post("/api/scrape", json=payload, headers=auth_headers(visitor["access_token"])).status_code == 403


def test_scrape_rejects_private_targets_for_owner(client, owner) -> None:
    response = client.post(
        "/api/scrape", json={"url": "http://127.0.0.1:5432/"}, headers=auth_headers(owner["access_token"])
    )
    assert response.status_code == 400


def test_scrape_uses_cache_and_retries_transport_errors(monkeypatch) -> None:
    calls = {"n": 0}

    async def flaky(url: str, strategy: str, debug: bool):
        calls["n"] += 1
        if calls["n"] == 1:
            raise httpx.ConnectError("transient")
        return extract_all_data(HTML, url), "HTTPX"

    monkeypatch.setattr(scrape_service, "scrape_product", flaky)
    scrape_service.cache.clear()
    data, strategy = asyncio.run(scrape_service.scrape_with_guards("https://example.com/p", "HTTPX", False))
    assert data["title"] == "Produit" and strategy == "HTTPX"
    assert calls["n"] == 2
    asyncio.run(scrape_service.scrape_with_guards("https://example.com/p", "HTTPX", False))
    assert calls["n"] == 2


def test_non_transient_errors_are_not_retried(monkeypatch) -> None:
    calls = {"n": 0}

    async def broken(url: str, strategy: str, debug: bool):
        calls["n"] += 1
        raise RuntimeError("parser exploded")

    monkeypatch.setattr(scrape_service, "scrape_product", broken)
    scrape_service.cache.clear()
    with pytest.raises(RuntimeError):
        asyncio.run(scrape_service.scrape_with_guards("https://example.com/broken", "HTTPX", False))
    assert calls["n"] == 1


def test_internal_canonical_url_is_rejected(monkeypatch) -> None:
    async def redirected(url: str, strategy: str, debug: bool):
        data = extract_all_data(HTML, url)
        data["canonical_url"] = "http://169.254.169.254/latest/meta-data/"
        return data, "HTTPX"

    monkeypatch.setattr(scrape_service, "scrape_product", redirected)
    scrape_service.cache.clear()
    with pytest.raises(scrape_service.ServiceError):
        asyncio.run(scrape_service.scrape_with_guards("https://example.com/redirect", "HTTPX", False))


def test_scrape_timeout_is_reported(monkeypatch) -> None:
    async def slow(url: str, strategy: str, debug: bool):
        await asyncio.sleep(1)
        return {}, "HTTPX"

    monkeypatch.setattr(scrape_service, "scrape_product", slow)
    fast_settings = dataclasses.replace(scrape_service.get_settings(), scrape_timeout_seconds=0.05)
    monkeypatch.setattr(scrape_service, "get_settings", lambda: fast_settings)
    scrape_service.cache.clear()
    with pytest.raises(scrape_service.ScrapeTimeout):
        asyncio.run(scrape_service.scrape_with_guards("https://example.com/slow", "HTTPX", False))
