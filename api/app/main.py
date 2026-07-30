import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import ScrapeRequest, ScrapeResponse
from app.scraper.engine import scrape_product

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

app = FastAPI(
    title="ListaYours Scraper API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    try:
        url_str = str(request.url)
        strategy_str = str(request.strategy)
        data, strategy = await scrape_product(url_str, strategy_str)
        return ScrapeResponse(
            success=True,
            data=data,
            error=None,
            strategy_used=strategy,
        )
    except Exception as e:
        logger.error(f"Erreur d'exécution : {e}")
        return ScrapeResponse(
            success=False,
            data=None,
            error=str(e),
            strategy_used=None,
        )