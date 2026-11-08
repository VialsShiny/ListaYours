from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class ScrapeRequest(BaseModel):
    url: HttpUrl = Field(..., description="URL de la page produit à scraper")
    strategy: Literal["HTTPX", "PLAYWRIGHT"] = Field(
        "HTTPX", description="Stratégie de scraping à utiliser. Valeurs: 'HTTPX', 'PLAYWRIGHT'"
    )
    debug: bool = Field(False, description="Activer le mode debug (True/False)")


class ProductData(BaseModel):
    product_url: str
    canonical_url: str | None = None
    title: str | None = None
    price: str | None = None
    old_price: str | None = None
    discount: str | None = None
    currency: str | None = None
    description: str | None = None
    images: list[str] = []
    gallery: list[str] = []
    brand: str | None = None
    sku: str | None = None
    availability: bool | None = False
    stock: str | None = None
    category: str | None = None
    variants: dict[str, Any] = {"size": [], "color": [], "style": [], "pattern": []}
    characteristics: dict[str, Any] = {}
    reviews: dict[str, Any] = {"rating_average": None, "review_count": None, "list": []}


class ScrapeResponse(BaseModel):
    success: bool
    data: ProductData | None = None
    error: str | None = None
    strategy_used: str | None = None
    debug: bool = False
