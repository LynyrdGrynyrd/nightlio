#!/bin/bash
set -e

npx vitest run

PYTEST_BIN="api/venv/bin/pytest"
if [ -x "$PYTEST_BIN" ]; then
  PYTHONPATH=. "$PYTEST_BIN"
else
  echo "api/venv/bin/pytest not found; falling back to python -m pytest."
  PYTHONPATH=. python -m pytest
fi
