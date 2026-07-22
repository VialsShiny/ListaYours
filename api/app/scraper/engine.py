import logging
import httpx
from playwright.async_api import async_playwright
from app.scraper.parser import extract_all_data
from pathlib import Path
from datetime import datetime

FILES_DIR = Path("screenshots")
FILES_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("scraper_engine")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

async def fetch_with_httpx(url: str) -> str:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }
    # filename = FILES_DIR / f"{datetime.now():%Y%m%d_%H%M%S}.png"
    # await take_screenshot(url, filename)
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.text

async def fetch_with_playwright(url: str) -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)
        content = await page.content()
        # filename = FILES_DIR / f"{datetime.now():%Y%m%d_%H%M%S}.png"
        # await take_screenshot(url, filename)
        await browser.close()
        return content
    
async def take_screenshot(url: str, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Saving screenshot: {path.resolve()}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.screenshot(path=str(path), full_page=True)
        await browser.close()

async def scrape_product(url: str) -> tuple[dict, str]:
    strategy = "HTTPX"
    try:
        logger.info(f"Tentative de récupération HTTPX : {url}")
        html = await fetch_with_httpx(url)
        data = extract_all_data(html, url)
        if data and data.get('title'):
            return data, strategy
    except Exception as e:
        logger.warning(f"Échec HTTPX pour {url} ({str(e)}). Basculement vers Playwright...")

    strategy = "PLAYWRIGHT"
    try:
        logger.info(f"Tentative de récupération Playwright : {url}")
        html = await fetch_with_playwright(url)
        data = extract_all_data(html, url)
        return data, strategy
    except Exception as e:
        logger.error(f"Erreur lors du scraping de {url}: {str(e)}")
        raise e