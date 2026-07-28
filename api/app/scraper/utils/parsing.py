import re
from typing import Any, Optional
import logging

logger = logging.getLogger("PARSING DEBUG")

def parse_price(price_val: Any) -> Optional[str]:
    """Extrait et normalise de façon robuste les valeurs numériques de prix en chaîne."""
    if price_val is None:
        return None
    if isinstance(price_val, (int, float)):
        return str(price_val)
    
    cleaned = re.sub(r'[^\d.,]', '', str(price_val))
    if not cleaned:
        return None
    if not re.search(r'\d', cleaned):
        return None
    
    cleaned = cleaned.strip(',.')
    if not cleaned:
        return None
    
    if ',' in cleaned and '.' in cleaned:
        cleaned = cleaned.replace(',', '')
    elif ',' in cleaned and '.' not in cleaned:
        if len(cleaned.split(',')[-1]) == 2:
            cleaned = cleaned.replace(',', '.')

    groups = re.findall(r'\d+(?:[.,]\d{2})', cleaned)
    if groups:
        cleaned = groups[-1]
            
    return cleaned