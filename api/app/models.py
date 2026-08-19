from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any, Literal

class ScrapeRequest(BaseModel):
    url: HttpUrl = Field(..., description="URL de la page produit à scraper")
    strategy: Literal['HTTPX', 'PLAYWRIGHT'] = Field('HTTPX', description="Stratégie de scraping à utiliser. Valeurs: 'HTTPX', 'PLAYWRIGHT'")
    debug: bool = Field(False, description="Activer le mode debug (True/False)")

class ProductData(BaseModel):
    product_url: str
    canonical_url: Optional[str] = None
    title: Optional[str] = None
    price: Optional[str] = None
    old_price: Optional[str] = None
    discount: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = []
    gallery: List[str] = []
    brand: Optional[str] = None
    sku: Optional[str] = None
    availability: Optional[bool] = False
    stock: Optional[str] = None
    category: Optional[str] = None
    variants: Dict[str, Any] = {"size": [], "color": [], "style": [], "pattern": []}
    characteristics: Dict[str, Any] = {}
    reviews: Dict[str, Any] = {"rating_average": None, "review_count": None, "list": []}

class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[ProductData] = None
    error: Optional[str] = None
    strategy_used: Optional[str] = None
    debug: bool = False