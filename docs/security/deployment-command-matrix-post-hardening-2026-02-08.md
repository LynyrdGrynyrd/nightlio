# Deployment Command Matrix (Post-Hardening, 2026-02-08)

This captures runtime entrypoints after centralized Gunicorn configuration.

## Gunicorn Invocation

1. `api/Procfile`
- `gunicorn -c gunicorn.conf.py wsgi:application`

2. `api/start.py` (production branch)
- `gunicorn -c <api_dir>/gunicorn.conf.py wsgi:application`

3. `api/wsgi.py` (when executed directly in production mode)
- `gunicorn -c <api_dir>/gunicorn.conf.py wsgi:application`

4. `api/docker_start.py` (production branch)
- `gunicorn -c <api_dir>/gunicorn.conf.py wsgi:application`

5. `api/run_production.sh`
- `gunicorn -c ./gunicorn.conf.py wsgi:application`

## Centralized Runtime Config

`api/gunicorn.conf.py` defines:
- bind address
- workers
- worker class
- timeout / graceful timeout / keepalive
- log output paths and level
- forwarded proxy IP policy
- request-size guardrails
- optional preload toggle

## CORS Runtime Policy

1. Main app (`api/app.py`)
- Strict, API-scoped CORS via:
  `CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}}, ...)`

2. Legacy standalone app (`api/api.py`)
- Aligned to explicit `CORS_ORIGINS` allowlist and `/api/*` scoping.
