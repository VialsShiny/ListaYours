import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import ProductData, ScrapeRequest, ScrapeResponse
from app.routers import auth
from app.scraper.engine import scrape_product

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("main")

settings = get_settings()

app = FastAPI(title="ListaYours API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    debug_bool = bool(request.debug)
    try:
        data, strategy = await scrape_product(str(request.url), str(request.strategy), debug_bool)
        return ScrapeResponse(
            success=True,
            data=ProductData.model_validate(data),
            error=None,
            strategy_used=strategy,
            debug=debug_bool,
        )
    except Exception as e:
        logger.error(f"Erreur d'exécution : {e}")
        return ScrapeResponse(success=False, data=None, error=str(e), strategy_used=None, debug=debug_bool)
