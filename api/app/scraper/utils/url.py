from urllib.parse import urlparse
import logging

logger = logging.getLogger("URL DEBUG")
PW_DOMAINS = ["aliexpress.com", "www.aliexpress.com", "fr.aliexpress.com"]

def get_url_domain(url: str) -> str:
    """Extract the domain from a URL."""
    try:
        parsed_url = urlparse(url)
        return parsed_url.netloc
    except Exception as e:
        logger.error(f"Error extracting domain from URL {url}: {e}")
        return ""
    
def is_require_pw_domain(url: str) -> bool:
	"""Check if the domain of the URL is in the list of domains that require Playwright."""
	domain = get_url_domain(url)
	return domain in PW_DOMAINS