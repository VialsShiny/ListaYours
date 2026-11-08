import argparse
import json
import logging
from pathlib import Path

from app.db.session import SessionLocal
from app.seed.models import load_seed
from app.seed.runner import run_seed_sync


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the owner's wishlist with the real scraper.")
    parser.add_argument("--file", default="seed/wishlist.json", help="Seed JSON file")
    parser.add_argument("--assets-base-url", required=True, help="Public origin serving the frontend /seed images")
    parser.add_argument("--no-scrape", action="store_true", help="Use PDF values only (no network)")
    parser.add_argument("--report", default=None, help="Write the JSON outcome report to this path")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    seed = load_seed(Path(args.file))
    with SessionLocal() as db:
        outcomes = run_seed_sync(db, seed, args.assets_base_url, scrape=not args.no_scrape)

    report = [
        {
            "name": o.name,
            "source": o.source,
            "price": None if o.price is None else f"{o.price:.2f}",
            "currency": o.currency,
            "image": o.image,
            "old_price": None if o.old_price is None else f"{o.old_price:.2f}",
            "flags": o.flags,
            "scraped_title": o.scraped_title,
        }
        for o in outcomes
    ]
    for outcome in outcomes:
        price = "-" if outcome.price is None else f"{outcome.price:.2f}"
        print(f"{outcome.source:8} {price:>9} {outcome.currency} | {outcome.name} | {', '.join(outcome.flags)}")
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"report written to {args.report}")


if __name__ == "__main__":
    main()
