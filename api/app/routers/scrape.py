import logging

from fastapi import APIRouter, Depends

from app.deps import OwnerUser, scrape_rate_limit
from app.schemas.scrape import ProductData, ScrapeRequest, ScrapeResponse
from app.services.errors import ServiceError
from app.services.scrape_service import ScrapeTimeout, scrape_with_guards

logger = logging.getLogger("scrape_router")
SCRAPE_FAILED = "Échec du scraping."

router = APIRouter(prefix="/api", tags=["scrape"], dependencies=[Depends(scrape_rate_limit)])


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest, _owner: OwnerUser) -> ScrapeResponse:
    """Owner-only: scrape a product page with the original engine; same request and response contract as before."""
    url = str(request.url)
    debug = bool(request.debug)
    try:
        data, strategy = await scrape_with_guards(url, str(request.strategy), debug)
    except ScrapeTimeout as error:
        logger.warning(str(error))
        return ScrapeResponse(success=False, data=None, error=str(error), strategy_used=None, debug=debug)
    except ServiceError:
        raise
    except Exception:
        logger.exception("Unexpected scrape failure for %s", url)
        return ScrapeResponse(success=False, data=None, error=SCRAPE_FAILED, strategy_used=None, debug=debug)
    return ScrapeResponse(
        success=True, data=ProductData.model_validate(data), error=None, strategy_used=strategy, debug=debug
    )
