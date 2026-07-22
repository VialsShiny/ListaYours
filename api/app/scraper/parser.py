import re
import json
import extruct
import logging
from bs4 import BeautifulSoup
from w3lib.html import get_base_url
from urllib.parse import urljoin
from typing import Dict, Any, Optional
from app.scraper.parsers.amazon import amazon_parsers

logger = logging.getLogger("TEST DEV")

def clean_text(text: Any) -> Optional[str]:
    """Nettoie les espaces blancs et normalise la chaîne de caractères."""
    if text is None:
        return None
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_price(price_val: Any) -> Optional[str]:
    """Extrait et normalise de façon robuste les valeurs numériques de prix en chaîne."""
    if price_val is None:
        return None
    if isinstance(price_val, (int, float)):
        return str(price_val)
    
    cleaned = re.sub(r'[^\d.,]', '', str(price_val))
    if not cleaned:
        return None
    
    if ',' in cleaned and '.' in cleaned:
        cleaned = cleaned.replace(',', '')
    elif ',' in cleaned and not '.' in cleaned:
        if len(cleaned.split(',')[-1]) == 2:
            cleaned = cleaned.replace(',', '.')
            
    return cleaned

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
    if not product_info['title']:
        h1_tags = soup.find_all('h1')
        for h1 in h1_tags:
            h1_class = " ".join(h1.get('class', []) or []).lower()
            if any(k in h1_class for k in ['product', 'title', 'name', 'heading', 'detail']):
                product_info['title'] = clean_text(h1.text)
                break
        if not product_info['title'] and h1_tags:
            product_info['title'] = clean_text(h1_tags[0].text)
        if not product_info['title'] and soup.find('title'):
            product_info['title'] = clean_text(soup.find('title').text)

    if not product_info['price']:
        price_elements = soup.find_all(class_=re.compile(r'(a-offscreen|current-price|price-item|product-price|price-value|price\$|amount|special-price|actual-price)', re.I))
        logger.info(price_elements)
        for elem in price_elements:
            text = clean_text(elem.text)
            parsed = parse_price(text)
            if parsed:
                product_info['price'] = parsed
                for symbol, iso_code in [('€', 'EUR'), ('$', 'USD'), ('£', 'GBP'), ('¥', 'JPY')]:
                    if symbol in text:
                        product_info['currency'] = product_info['currency'] or iso_code
                break

    old_price_elements = soup.find_all(['del', 's']) or soup.find_all(class_=re.compile(r'(old-price|compare-price|regular-price|list-price|strike|original-price)', re.I))
    for elem in old_price_elements:
        parsed_old = parse_price(elem.text)
        if parsed_old and parsed_old != product_info['price']:
            product_info['old_price'] = parsed_old
            break

    logger.info(product_info['price'])

    if product_info['price'] and product_info['old_price']:
        try:
            p_float = float(product_info['price'])
            op_float = float(product_info['old_price'])
            if op_float > p_float:
                pct = round(((op_float - p_float) / op_float) * 100)
                product_info['discount'] = f"-{pct}%"
        except ValueError:
            pass

    logger.info(product_info['price'])

    for img in soup.find_all("img"):
        img_src = None

        for attr in ("product", "gallery", "carousel", "main", "featured", "zoom", "thumb"):
            value = img.get(attr)
            if value:
                img_src = value
                break

        if not img_src or img_src.startswith("data:"):
            continue

        if "," in img_src:
            candidates = []
            for part in img_src.split(","):
                part = part.strip().split(" ")[0]
                if part:
                    candidates.append(part)

            if candidates:
                img_src = candidates[-1]

        full_url = urljoin(base_url, img_src)

        if full_url not in product_info["gallery"]:
            product_info["gallery"].append(full_url)

    if not product_info["images"] and product_info["gallery"]:
        product_info["images"] = product_info["gallery"][:2]

    for container in soup.select("table, dl"):
        if container.name == "table":
            pairs = (
                (clean_text(cells[0].get_text()), clean_text(cells[1].get_text()))
                for row in container.select("tr")
                if len(cells := row.select("th, td")) >= 2
            )
        else:
            pairs = (
                (clean_text(dt.get_text()), clean_text(dd.get_text()))
                for dt, dd in zip(container.select("dt"), container.select("dd"))
            )

        for k, v in pairs:
            if not k or not v or len(k) > 80:
                continue

            product_info["characteristics"][k.rstrip(":")] = v

            key = "".join(c.lower() for c in k if c.isalnum())

            # ASIN est universel
            if key == "asin":
                product_info["sku"] = v

            # La marque n'est renseignée qu'une seule fois
            elif not product_info.get("brand") and len(v) < 100:
                if "brand" in key or "mar" in key:
                    product_info["brand"] = v

    for sel in soup.find_all('select'):
        sel_id = (sel.get('id') or '').lower()
        sel_name = (sel.get('name') or '').lower()
        sel_class = " ".join(sel.get('class', []) or []).lower()
        
        is_size = any(k in sel_id or k in sel_name or k in sel_class for k in ['size', 'taille', 'format', 'dimension'])
        is_color = any(k in sel_id or k in sel_name or k in sel_class for k in ['color', 'couleur', 'teinte', 'pattern'])
        
        opts = [clean_text(o.text) for o in sel.find_all('option') if o.get('value') and o.text.strip()]
        opts = [o for o in opts if o and not any(p in o.lower() for p in ['choisir', 'sélectionner', 'select', 'choose'])]
        
        if opts:
            if is_size:
                product_info['variants']['size'].extend([o for o in opts if o not in product_info['variants']['size']])
            elif is_color:
                product_info['variants']['color'].extend([o for o in opts if o not in product_info['variants']['color']])

    amazon_parsers(product_info, soup, base_url)


    nullable_fields = ['title', 'price', 'old_price', 'discount', 'currency', 'description', 'brand', 'sku', 'stock', 'category']
    for field in nullable_fields:
        if not product_info[field]:
            product_info[field] = None

    return product_info