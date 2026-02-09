# Deployment Command Matrix (Pre-Hardening Baseline, 2026-02-08)

This captures production/runtime command entrypoints before the major hardening wave.

## Gunicorn Invocation Baseline

1. `api/Procfile`
- `gunicorn --bind [::]:$PORT --workers 4 --timeout 120 --worker-class sync --access-logfile - --error-logfile - wsgi:application`

2. `api/start.py` (production branch)
- `gunicorn --bind [::]:{PORT} --workers 4 --timeout 120 --worker-class sync --access-logfile - --error-logfile - wsgi:application`

3. `api/wsgi.py` (when executed directly in production mode)
- `gunicorn --bind [::]:{PORT} --workers 4 --timeout 120 --worker-class sync --access-logfile - --error-logfile - wsgi:application`

4. `api/docker_start.py` (production branch)
- `gunicorn --bind [::]:{PORT} --workers 4 --timeout 120 --worker-class sync --access-logfile - --error-logfile - wsgi:application`

5. `api/run_production.sh`
- `gunicorn --bind "[::]:$PORT" --workers "$WORKERS" --timeout "$TIMEOUT" --worker-class sync --access-logfile - --error-logfile - --preload wsgi:application`

## CORS Baseline

1. Main app (`api/app.py`)
- `CORS(app, origins=app.config["CORS_ORIGINS"])`

2. Legacy standalone app (`api/api.py`)
- `CORS(app)` (permissive defaults)

## Compose and Env Baseline

1. `docker-compose.yml`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:5000`

2. `docker-compose.prod.yml`
- `CORS_ORIGINS=https://yourdomain.com`

3. `.env.docker`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:5000`
