#!/bin/bash
npx vitest run && PYTHONPATH=. api/venv/bin/pytest
