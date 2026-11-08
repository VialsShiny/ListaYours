import pytest

from app.scraper import engine

HTML_WITH_TITLE = "<html><head><title>Produit</title></head><body><h1>Produit</h1></body></html>"
HTML_WITHOUT_TITLE = "<html><body></body></html>"


class FetchRecorder:
    def __init__(self, httpx_result=None, httpx_error=None, pw_result=HTML_WITH_TITLE):
        self.calls: list[str] = []
        self.httpx_result = httpx_result
        self.httpx_error = httpx_error
        self.pw_result = pw_result

    async def httpx(self, url: str, debug: bool) -> str:
        self.calls.append("httpx")
        if self.httpx_error:
            raise self.httpx_error
        return self.httpx_result

    async def playwright(self, url: str, strategy: str, debug: bool) -> str:
        self.calls.append("playwright")
        return self.pw_result


@pytest.fixture
def recorder(monkeypatch):
    def install(**kwargs):
        rec = FetchRecorder(**kwargs)
        monkeypatch.setattr(engine, "fetch_with_httpx", rec.httpx)
        monkeypatch.setattr(engine, "fetch_with_playwright", rec.playwright)
        return rec

    return install


async def test_httpx_success_is_returned_without_playwright(recorder) -> None:
    rec = recorder(httpx_result=HTML_WITH_TITLE)
    data, strategy = await engine.scrape_product("https://example.com/p", "HTTPX", False)
    assert rec.calls == ["httpx"]
    assert strategy == "HTTPX"
    assert data["title"] == "Produit"


async def test_httpx_without_title_falls_back_to_playwright(recorder) -> None:
    rec = recorder(httpx_result=HTML_WITHOUT_TITLE)
    _, strategy = await engine.scrape_product("https://example.com/p", "HTTPX", False)
    assert rec.calls == ["httpx", "playwright"]
    assert strategy == "PLAYWRIGHT"


async def test_httpx_error_falls_back_to_playwright(recorder) -> None:
    rec = recorder(httpx_error=RuntimeError("429"))
    _, strategy = await engine.scrape_product("https://example.com/p", "HTTPX", False)
    assert rec.calls == ["httpx", "playwright"]
    assert strategy == "PLAYWRIGHT"


async def test_aliexpress_skips_httpx(recorder) -> None:
    rec = recorder(httpx_result=HTML_WITH_TITLE)
    _, strategy = await engine.scrape_product("https://fr.aliexpress.com/item/1.html", "HTTPX", False)
    assert rec.calls == ["playwright"]
    assert strategy == "PLAYWRIGHT"


async def test_playwright_strategy_goes_straight_to_browser(recorder) -> None:
    rec = recorder(httpx_result=HTML_WITH_TITLE)
    _, strategy = await engine.scrape_product("https://example.com/p", "PLAYWRIGHT", False)
    assert rec.calls == ["playwright"]
    assert strategy == "PLAYWRIGHT"


async def test_playwright_failure_is_raised(recorder, monkeypatch) -> None:
    rec = recorder(httpx_error=RuntimeError("down"))

    async def broken(url: str, strategy: str, debug: bool) -> str:
        rec.calls.append("playwright")
        raise TimeoutError("browser timeout")

    monkeypatch.setattr(engine, "fetch_with_playwright", broken)
    with pytest.raises(TimeoutError):
        await engine.scrape_product("https://example.com/p", "HTTPX", False)
    assert rec.calls == ["httpx", "playwright"]
