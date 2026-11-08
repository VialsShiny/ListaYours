# Decisions log

One line per decision, with the rationale. Newest at the bottom.

| # | Date | Decision | Rationale |
|---|------|----------|-----------|
| 1 | 2026-11-08 | Existing scraper files (`api/app/scraper/**`) are exempt from the 200-line and no-inline-comment rules and are not refactored. | The scraper contract requires identical behavior; splitting `parser.py` (280 lines) or `default.py` (416 lines) would be a rewrite of working code with no functional gain. New code follows the conventions. |
| 2 | 2026-11-08 | Lint/typecheck tooling (ruff, mypy) excludes `api/app/scraper/**`. | Same reason as #1: the scraper is frozen by the parity test, so style tooling must not force edits into it. |
| 3 | 2026-11-08 | Local Python 3.11 is provided through `uv` (`make install` creates `api/.venv` with Python 3.11). | The host only ships Python 3.14, which the pinned `pydantic==2.5.3` / `lxml==4.9.4` / `playwright==1.41.0` do not support; the Docker image already uses 3.11, so local and container runtimes now match. |
| 4 | 2026-11-08 | Captcha / robot detection is not added to the scraper output; the seed script detects blocked pages (no title, or a title/description matching captcha markers) and falls back to the PDF data. | The output schema is frozen by the contract; the current code has no explicit captcha field, so detection lives in the consumer. |
