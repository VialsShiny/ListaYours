import json
import extruct
import logging
from bs4 import BeautifulSoup
from w3lib.html import get_base_url
from urllib.parse import urljoin
from typing import Dict, Any
from app.scraper.parsers.default import default_parsers
from app.scraper.parsers.amazon import amazon_parsers
from app.scraper.utils.text import clean_text
from app.scraper.utils.parsing import parse_price

logger = logging.getLogger("TEST DEV")

def extract_all_data(html: str, url: str) -> Dict[str, Any]:
    """
    Extrait de manière universelle et sécurisée toutes les données d'un produit.
    Gère défensivement les valeurs 'None' renvoyées par Amazon ou extruct.
    """
    base_url = get_base_url(html, url)
    soup = BeautifulSoup(html, 'html.parser')
    
    try:
        extruct_data = extruct.extract(
            html, 
            base_url=base_url, 
            syntaxes=['json-ld', 'microdata', 'rdfa', 'opengraph']
        ) or {}
    except Exception:
        extruct_data = {}

    product_info: Dict[str, Any] = {
        "product_url": url,
        "canonical_url": None,
        "title": None,
        "price": None,
        "old_price": None,
        "discount": None,
        "currency": None,
        "description": None,
        "images": [],
        "gallery": [],
        "brand": None,
        "sku": None,
        "availability": False,
        "stock": None,
        "category": None,
        "variants": {
            "size": [],
            "color": [],
            "style": [],
            "pattern": [],
        },
        "characteristics": {},
        "reviews": {
            "rating_average": None,
            "review_count": None,
            "list": []
        }
    }

    canonical_tag = soup.find('link', rel='canonical')
    if canonical_tag and canonical_tag.get('href'):
        product_info['canonical_url'] = urljoin(base_url, canonical_tag.get('href'))
    else:
        product_info['canonical_url'] = url

    # =========================================================================
    # STRATÉGIE 1 : JSON-LD (Protection contre NoneType)
    # =========================================================================
    json_ld_items = extruct_data.get('json-ld') or []
    if not isinstance(json_ld_items, list):
        json_ld_items = []

    for script in soup.find_all('script', type='application/ld+json'):
        try:
            content = script.string
            if content:
                loaded = json.loads(content)
                if isinstance(loaded, list):
                    json_ld_items.extend(loaded)
                elif isinstance(loaded, dict):
                    json_ld_items.append(loaded)
        except Exception:
            continue

    def process_product_node(node: Dict[str, Any]):
        if not isinstance(node, dict):
            return
        
        if node.get('name'):
            product_info['title'] = product_info['title'] or clean_text(node.get('name'))
        if node.get('description'):
            product_info['description'] = product_info['description'] or clean_text(node.get('description'))
        
        for sku_key in ['sku', 'mpn', 'gtin13', 'gtin8', 'gtin14', 'productID']:
            if node.get(sku_key):
                product_info['sku'] = product_info['sku'] or clean_text(node.get(sku_key))
                break
            
        brand = node.get('brand')
        if isinstance(brand, dict):
            product_info['brand'] = product_info['brand'] or clean_text(brand.get('name'))
        elif isinstance(brand, str):
            product_info['brand'] = product_info['brand'] or clean_text(brand)
            
        if node.get('category'):
            product_info['category'] = product_info['category'] or clean_text(node.get('category'))

        imgs = node.get('image')
        if imgs:
            img_nodes = imgs if isinstance(imgs, list) else [imgs]
            for img_item in img_nodes:
                if not img_item:
                    continue
                img_url = img_item if isinstance(img_item, str) else img_item.get('url') if isinstance(img_item, dict) else None
                if img_url:
                    full_img_url = urljoin(base_url, img_url)
                    if full_img_url not in product_info['images']:
                        product_info['images'].append(full_img_url)

        offers = node.get('offers')
        if offers:
            offers_list = offers if isinstance(offers, list) else [offers]
            for offer in offers_list:
                if not isinstance(offer, dict):
                    continue
                
                if offer.get('@type') == 'AggregateOffer':
                    p_val = offer.get('lowPrice') or offer.get('highPrice') or offer.get('price')
                else:
                    p_val = offer.get('price')
                    
                if p_val:
                    product_info['price'] = product_info['price'] or parse_price(p_val)
                if offer.get('priceCurrency'):
                    product_info['currency'] = product_info['currency'] or clean_text(offer.get('priceCurrency'))
                
                avail = offer.get('availability')
                if avail and isinstance(avail, str):
                    if 'InStock' in avail:
                        product_info['stock'] = "InStock"
                        product_info['availability'] = True
                    elif 'OutOfStock' in avail:
                        product_info['stock'] = "OutOfStock"
                        product_info['availability'] = False

        agg_rating = node.get('aggregateRating')
        if isinstance(agg_rating, dict):
            if agg_rating.get('ratingValue'):
                product_info['reviews']['rating_average'] = product_info['reviews']['rating_average'] or agg_rating.get('ratingValue')
            if agg_rating.get('reviewCount') or agg_rating.get('ratingCount'):
                product_info['reviews']['review_count'] = product_info['reviews']['review_count'] or (agg_rating.get('reviewCount') or agg_rating.get('ratingCount'))

        reviews = node.get('review')
        if reviews:
            rev_list = reviews if isinstance(reviews, list) else [reviews]
            for r in rev_list:
                if isinstance(r, dict):
                    author_node = r.get('author', {})
                    author = author_node.get('name') if isinstance(author_node, dict) else r.get('author')
                    review_data = {
                        "author": clean_text(author),
                        "date": r.get('datePublished'),
                        "rating": r.get('averageCustomerReviews', {}).get('a-size-small') if isinstance(r.get('reviewRating'), dict) else None,
                        "text": clean_text(r.get('reviewBody') or r.get('description'))
                    }
                    if review_data["text"] and review_data not in product_info['reviews']['list']:
                        product_info['reviews']['list'].append(review_data)

    for item in json_ld_items:
        if not isinstance(item, dict):
            continue
        
        # SÉCURISATION : Si item.get('@graph') vaut None, fallback sur [item]
        nodes = item.get('@graph')
        if nodes is None:
            nodes = [item]
        elif not isinstance(nodes, list):
            nodes = [nodes]

        for node in nodes:
            if not isinstance(node, dict):
                continue
            node_type = node.get('@type', '')
            if node_type is None:
                continue
            types = node_type if isinstance(node_type, list) else [node_type]
            if any(t and isinstance(t, str) and t.lower() == 'product' for t in types):
                process_product_node(node)

    # =========================================================================
    # STRATÉGIE 2 : MICRODATA & RDFA
    # =========================================================================
    for syntax in ['microdata', 'rdfa']:
        items = extruct_data.get(syntax) or []
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            i_type = item.get('type', item.get('@type', ''))
            if i_type is None:
                continue
            types = i_type if isinstance(i_type, list) else [i_type]
            if any(t and isinstance(t, str) and 'product' in t.lower() for t in types):
                props = item.get('properties', item)
                if isinstance(props, dict):
                    if props.get('name'):
                        product_info['title'] = product_info['title'] or clean_text(props.get('name'))
                    if props.get('description'):
                        product_info['description'] = product_info['description'] or clean_text(props.get('description'))
                    if props.get('sku'):
                        product_info['sku'] = product_info['sku'] or clean_text(props.get('sku'))
                    if props.get('price'):
                        product_info['price'] = product_info['price'] or parse_price(props.get('price'))
                    if props.get('priceCurrency'):
                        product_info['currency'] = product_info['currency'] or clean_text(props.get('priceCurrency'))

    # =========================================================================
    # STRATÉGIE 3 : OPENGRAPH ET META TAGS
    # =========================================================================
    meta_data = {}
    og_items = extruct_data.get('opengraph') or []
    if isinstance(og_items, list):
        for og in og_items:
            if not isinstance(og, dict):
                continue
            props = og.get('properties') or []
            if isinstance(props, list):
                for prop in props:
                    if isinstance(prop, (list, tuple)) and len(prop) >= 2:
                        meta_data[prop[0]] = prop[1]

    for meta in soup.find_all('meta'):
        prop_key = meta.get('property', '') or meta.get('name', '')
        content_val = meta.get('content', '')
        if prop_key and content_val:
            meta_data[prop_key] = content_val

    meta_mappings = {
        'title': ['og:title', 'twitter:title', 'title'],
        'description': ['og:description', 'twitter:description', 'description', 'keywords'],
        'price': ['product:price:amount', 'og:price:amount', 'twitter:data1', 'price'],
        'currency': ['product:price:currency', 'og:price:currency', 'currency'],
        'brand': ['product:brand', 'og:brand', 'brand'],
        'sku': ['product:retailer_item_id', 'product:sku', 'sku'],
        'availability': ['product:availability', 'og:availability', 'availability']
    }

    for field, tags in meta_mappings.items():
        if not product_info[field]:
            for tag in tags:
                if tag in meta_data and meta_data[tag]:
                    if field == 'price':
                        product_info[field] = parse_price(meta_data[tag])
                    else:
                        product_info[field] = clean_text(meta_data[tag])
                    break

    for tag_img in ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']:
        if tag_img in meta_data and meta_data[tag_img]:
            full_img = urljoin(base_url, meta_data[tag_img])
            if full_img not in product_info['images']:
                product_info['images'].append(full_img)

    # =========================================================================
    # STRATÉGIE 4 : HEURISTIQUES DOM PAR DÉFAUT
    # =========================================================================

    default_parsers(product_info, soup, base_url)
    amazon_parsers(product_info, soup, base_url)

    nullable_fields = ['title', 'price', 'old_price', 'discount', 'currency', 'description', 'brand', 'sku', 'stock', 'category']
    for field in nullable_fields:
        if not product_info[field]:
            product_info[field] = None

    return product_info