from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any

class ScrapeRequest(BaseModel):
    url: HttpUrl = Field(..., description="URL de la page produit à scraper")

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
    availability: Optional[str] = None
    stock: Optional[str] = None
    category: Optional[str] = None
    variants: Dict[str, Any] = {"sizes": [], "colors": [], "list": []}
    characteristics: Dict[str, Any] = {}
    videos: List[str] = []
    reviews: Dict[str, Any] = {"rating_average": None, "review_count": None, "list": []}

class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[ProductData] = None
    error: Optional[str] = None
    strategy_used: Optional[str] = None