import re
from typing import Any, Optional

def clean_text(text: Any) -> Optional[str]:
    """Nettoie les espaces blancs et normalise la chaîne de caractères."""
    if text is None:
        return None
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()