import re
from typing import Any, Optional
import logging

logger = logging.getLogger("PARSING DEBUG")
SIZE_TOKEN_RE = re.compile(r"^(?:EU|UK|US|FR|IT)?\s*\d{1,2}(?:[.,]5)?$", re.IGNORECASE)

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
        cleaned = groups[0]
            
    return cleaned

def _normalize_size_token(tok: str, sizes_set) -> str | None:
    """Return a canonical size string, or None if not a valid size token."""
    tok = tok.strip().upper().replace(",", ".")
    if not tok:
        return None
    if tok in sizes_set:
        return tok
    if SIZE_TOKEN_RE.match(tok):
        return tok
    return None


def _extract_size_candidates(raw_text: str, sizes_set) -> list[str]:
    """Split combined sizes like 'XS/S' or 'EU 38 / EU 39' into individual tokens."""
    parts = re.split(r"[/,]| - |\bou\b|\bor\b", raw_text, flags=re.IGNORECASE)
    results = []
    for part in parts:
        norm = _normalize_size_token(part, sizes_set)
        if norm:
            results.append(norm)
    return results