SHELL := /bin/bash
.DEFAULT_GOAL := help

API_DIR := api
FRONT_DIR := frontend
VENV := $(API_DIR)/.venv
PY := $(VENV)/bin/python
UV ?= $(shell command -v uv 2>/dev/null || echo $(HOME)/.cache/listayours-tools/bin/uv)
API_PORT ?= 8000

.PHONY: help install dev build lint format test typecheck docker-build docker-up docker-down clean db-up seed

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "ListaYours — available targets:\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install API (Python 3.11 venv) and frontend dependencies, Chromium and git hooks
	@if [ -x "$(UV)" ]; then \
		"$(UV)" venv $(VENV) --python 3.11 --allow-existing -q && \
		"$(UV)" pip install --python $(PY) -q -r $(API_DIR)/requirements-dev.txt; \
	else \
		python3.11 -m venv $(VENV) && $(PY) -m pip install -q -r $(API_DIR)/requirements-dev.txt; \
	fi
	$(VENV)/bin/playwright install chromium
	cd $(FRONT_DIR) && npm ci
	npm ci --ignore-scripts && npx husky

db-up: ## Start only the Postgres service
	docker compose up -d db

dev: db-up ## Run API (reload) and frontend (dev) locally against the compose Postgres
	@trap 'kill 0' INT TERM; \
	( cd $(API_DIR) && .venv/bin/uvicorn app.main:app --reload --port $(API_PORT) ) & \
	( cd $(FRONT_DIR) && npm run dev ) & \
	wait

seed: ## Seed the owner's wishlist with the real scraper (needs DATABASE_URL, OWNER_EMAIL, OWNER_PASSWORD)
	cd $(API_DIR) && .venv/bin/python -m app.seed --file seed/wishlist.json --assets-base-url $${SEED_ASSETS_BASE_URL:-http://localhost:3000} --report seed/last-run.json

build: ## Build the frontend and byte-compile the API
	$(PY) -m compileall -q $(API_DIR)/app
	cd $(FRONT_DIR) && npm run build

lint: ## Lint API (ruff) and frontend (eslint, prettier --check)
	cd $(API_DIR) && .venv/bin/ruff check . && .venv/bin/ruff format --check .
	cd $(FRONT_DIR) && npm run lint && npm run format:check

format: ## Format API (ruff) and frontend (prettier)
	cd $(API_DIR) && .venv/bin/ruff check --fix . && .venv/bin/ruff format .
	cd $(FRONT_DIR) && npm run format

test: ## Run API and frontend test suites
	cd $(API_DIR) && .venv/bin/python -m pytest -q
	cd $(FRONT_DIR) && npm test

typecheck: ## Typecheck API (mypy) and frontend (tsc)
	cd $(API_DIR) && .venv/bin/mypy
	cd $(FRONT_DIR) && npm run typecheck

docker-build: ## Build the API and frontend images
	docker compose build

docker-up: ## Start the full stack (db, api, frontend) in the background
	docker compose up -d --build

docker-down: ## Stop the full stack (keeps the database volume)
	docker compose down

clean: ## Remove build artifacts and caches
	rm -rf $(FRONT_DIR)/.next $(FRONT_DIR)/coverage $(FRONT_DIR)/tsconfig.tsbuildinfo
	rm -rf $(API_DIR)/.pytest_cache $(API_DIR)/.mypy_cache $(API_DIR)/.ruff_cache
	find $(API_DIR) -type d -name __pycache__ -not -path "*/.venv/*" -prune -exec rm -rf {} +
