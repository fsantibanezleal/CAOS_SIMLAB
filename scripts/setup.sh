#!/usr/bin/env bash
# CAOS_SIMLAB — create the local Python .venv and install deps (macOS / Linux / Git-Bash).
set -euo pipefail
cd "$(dirname "$0")/.."

PY="${PYTHON:-python3}"
if [ ! -d ".venv" ]; then
  echo "Creating .venv..."
  "$PY" -m venv .venv
fi
VENV_PY=".venv/bin/python"
[ -x "$VENV_PY" ] || VENV_PY=".venv/Scripts/python.exe"  # Git-Bash on Windows

"$VENV_PY" -m pip install --upgrade pip
"$VENV_PY" -m pip install -r requirements.txt -r requirements-dev.txt

echo
echo "Ready. Next:"
echo "  $VENV_PY -m pytest                  # run the tests"
echo "  ./scripts/precompute.sh s01_queue   # run the M/M/c queue"
