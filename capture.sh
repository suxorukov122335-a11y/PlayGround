#!/usr/bin/env bash
# Capture the deployed game at CAPTURE_URL. Evidence is written only to CAPTURE_DIR.
set -uo pipefail

: "${CAPTURE_URL:?Set CAPTURE_URL to the page to capture}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to a directory outside the source tree}"

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "$(cd "$(dirname "$0")" && pwd)/scripts/capture.mjs"
status=$?

if [ "$status" -eq 0 ]; then
  /usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png" || status=1
  /usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png" || status=1
fi
exit "$status"
