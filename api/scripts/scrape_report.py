"""Success rate of the scraper parser on the fixture corpus, per field, optionally before vs after.

    .venv/bin/python scripts/scrape_report.py                       # current parser, table on stdout
    .venv/bin/python scripts/scrape_report.py --baseline DIR \\
        --markdown ../docs/SCRAPER-REPORT.md                        # DIR holds main's app/ package

The baseline run is a subprocess importing `app.scraper.parser` from DIR, so two versions of the
parser never share a process. Match rules per field live in `scrape_report_rules.py`.
"""

from __future__ import annotations

import argparse
import gzip
import json
import subprocess
import sys
import time
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
FIXTURES = API_DIR / "tests" / "scraper" / "fixtures"


def read_html(path: Path) -> str:
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            return handle.read()
    return path.read_text(encoding="utf-8")


def load_corpus() -> list[dict]:
    return json.loads((FIXTURES / "corpus.json").read_text(encoding="utf-8"))


def run_parser(parser_root: Path) -> dict[str, dict[str, bool]]:
    """Per page, per field: does the parser output match the hand-checked expectation?"""
    sys.path.insert(0, str(parser_root))
    from scrape_report_rules import FIELDS, field_matches

    from app.scraper.parser import extract_all_data

    results: dict[str, dict[str, bool]] = {}
    seconds = 0.0
    for case in load_corpus():
        expected = json.loads((FIXTURES / f"{case['name']}.expected.json").read_text(encoding="utf-8"))
        html = read_html(FIXTURES / case["file"])
        started = time.perf_counter()
        actual = extract_all_data(html, case["url"])
        seconds += time.perf_counter() - started
        results[case["name"]] = {field: field_matches(field, expected, actual) for field in FIELDS}
    results["_seconds"] = {"parse": round(seconds, 1)}
    return results


def run_baseline(baseline: Path) -> dict[str, dict[str, bool]]:
    command = [sys.executable, str(Path(__file__).resolve()), "--json", "--parser-root", str(baseline)]
    output = subprocess.run(command, check=True, capture_output=True, text=True, cwd=API_DIR).stdout
    return json.loads(output)


def print_table(before: dict[str, dict[str, bool]] | None, after: dict[str, dict[str, bool]]) -> None:
    from scrape_report_md import rates

    before_rates, after_rates = rates(before) if before else None, rates(after)
    for field, rate in after_rates.items():
        prefix = f"{before_rates[field]:6.1f}% -> " if before_rates else ""
        print(f"{field:20} {prefix}{rate:6.1f}%")
    prefix = f"{before['_seconds']['parse']}s -> " if before else ""
    print(f"{'parse time (corpus)':20} {prefix}{after['_seconds']['parse']}s")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--baseline", type=Path, help="directory holding the reference app/ package (main)")
    parser.add_argument("--markdown", type=Path, help="write the report with charts to this file")
    parser.add_argument("--parser-root", type=Path, default=API_DIR, help=argparse.SUPPRESS)
    parser.add_argument("--json", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()

    after = run_parser(args.parser_root)
    if args.json:
        print(json.dumps(after))
        return
    before = run_baseline(args.baseline) if args.baseline else None
    print_table(before, after)
    if args.markdown:
        from scrape_report_md import render

        args.markdown.write_text(render(before, after), encoding="utf-8")
        print(f"written {args.markdown}")


if __name__ == "__main__":
    main()
