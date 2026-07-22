import logging
from typing import Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger("TEST ALIEXPRESS")

def clean_text_local(text: Any) -> str:
    """Petit helper pour éviter les soucis d'import croisé."""
    if not text:
        return ""
    return " ".join(str(text).split())

def _extract_title(soup: BeautifulSoup, product_info: Dict[str, Any]) -> None:
    """Extract product title from BeautifulSoup object."""
    h1_tag = soup.find('h1', attrs={'data-pl': True})
    
    if h1_tag:
        title = h1_tag.get('data-pl')
        product_info['description'] = clean_text_local(title)

def aliexpress_parsers(
    product_info: Dict[str, Any], 
    soup: BeautifulSoup, 
) -> None:  
    """Parse Aliexpress product information."""
    _extract_title(soup, product_info)