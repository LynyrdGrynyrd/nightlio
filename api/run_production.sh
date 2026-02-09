#!/bin/bash
# Production startup script using Gunicorn
# Usage: ./run_production.sh [port]

PORT=${1:-5000}
WORKERS=${WORKERS:-4}
TIMEOUT=${TIMEOUT:-120}
GUNICORN_PRELOAD=${GUNICORN_PRELOAD:-1}

echo "Starting Twilightio API with Gunicorn"
echo "Port: $PORT"
echo "Workers: $WORKERS"
echo "Timeout: $TIMEOUT"
echo "Preload: $GUNICORN_PRELOAD"

cd "$(dirname "$0")"

export PORT WORKERS TIMEOUT GUNICORN_PRELOAD

gunicorn -c ./gunicorn.conf.py wsgi:application
