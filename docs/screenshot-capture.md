# Screenshot Capture

> Technical note for developers.

## Overview

This feature adds an optional screenshot capture during the scraping pipeline for debugging purposes.

Screenshots are generated with **Playwright** and stored locally in the `screenshots/` directory.

## Workflow

```text
Scrape request
      │
      ▼
HTML retrieval
      │
      ▼
Screenshot capture (optional)
      │
      ▼
HTML parsing
      │
      ▼
API response
```

## Implementation

- `api/app/scraper/engine.py`
  - `take_screenshot()`
  - Screenshot storage management
  - Playwright page capture

## Storage

```text
screenshots/
└── <generated-file>.png
```

## Notes

- Intended for debugging only.
- Uses Playwright to render the page before capture.
- Capture should not impact the normal scraping flow when disabled.
- Generated files should not be committed to the repository.

## Future Improvements

- Automatic cleanup of old screenshots.
- Configurable output directory.
