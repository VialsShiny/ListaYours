import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import account, auth, owner_categories, owner_gifts, owner_wishlist, public, reservations, scrape
from app.services.errors import ServiceError

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

settings = get_settings()


def docs_options(production: bool) -> dict[str, str | None]:
    """Interactive docs and the OpenAPI schema are served in development only."""
    if production:
        return {"docs_url": None, "redoc_url": None, "openapi_url": None}
    return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


docs = docs_options(settings.is_production)
app = FastAPI(
    title="ListaYours API",
    version="2.0.0",
    docs_url=docs["docs_url"],
    redoc_url=docs["redoc_url"],
    openapi_url=docs["openapi_url"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ServiceError)
async def service_error_handler(_request: Request, error: ServiceError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"detail": error.message})


for router in (
    auth.router,
    account.router,
    scrape.router,
    owner_wishlist.router,
    owner_categories.router,
    owner_gifts.router,
    public.router,
    reservations.router,
):
    app.include_router(router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
