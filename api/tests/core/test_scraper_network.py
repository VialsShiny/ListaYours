import asyncio
import http.server
import threading
from collections.abc import Iterator

import httpx
import pytest

from app.scraper.egress_proxy import egress_proxy
from app.scraper.network import get_following_safe_redirects
from app.utils.url_safety import UnsafeUrl, resolve_public


class _Secret(http.server.BaseHTTPRequestHandler):
    hits = 0

    def do_GET(self) -> None:
        _Secret.hits += 1
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"internal")

    def log_message(self, *args) -> None:
        return


@pytest.fixture
def internal_server() -> Iterator[int]:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Secret)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    _Secret.hits = 0
    yield server.server_address[1]
    server.shutdown()


def test_redirect_to_loopback_is_refused_before_the_hop(internal_server: int) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "public.example":
            return httpx.Response(302, headers={"location": f"http://127.0.0.1:{internal_server}/"})
        return httpx.Response(200, text="unreachable")

    async def run() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(UnsafeUrl):
                await get_following_safe_redirects(client, "http://public.example/", {})

    asyncio.run(run())
    assert _Secret.hits == 0


def test_relative_redirects_are_followed_up_to_the_limit() -> None:
    seen: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        if request.url.path == "/final":
            return httpx.Response(200, text="done")
        return httpx.Response(301, headers={"location": "/final"})

    async def run() -> httpx.Response:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await get_following_safe_redirects(client, "http://1.1.1.1/start", {})

    response = asyncio.run(run())
    assert response.text == "done" and seen == ["http://1.1.1.1/start", "http://1.1.1.1/final"]


def test_egress_proxy_refuses_loopback_and_private_targets(internal_server: int) -> None:
    async def run() -> list[int]:
        statuses = []
        async with egress_proxy() as proxy:
            async with httpx.AsyncClient(proxy=proxy.server_url, timeout=5) as client:
                for url in (f"http://127.0.0.1:{internal_server}/", "http://10.0.0.1/", "http://localhost/"):
                    statuses.append((await client.get(url)).status_code)
                with pytest.raises(httpx.ProxyError):
                    await client.get("https://169.254.169.254/latest/meta-data/")
        return statuses

    assert asyncio.run(run()) == [403, 403, 403]
    assert _Secret.hits == 0


def test_resolve_public_returns_the_checked_address() -> None:
    assert resolve_public("https://1.1.1.1/") == ("1.1.1.1", 443)
    with pytest.raises(UnsafeUrl):
        resolve_public("http://127.0.0.1:9/")
