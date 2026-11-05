#!/usr/bin/env bash
# Build the static game and serve it in the foreground for the preview tunnel.
set -euo pipefail

PROJECT_DIR="/home/runner/work/PlayGround/PlayGround"
BUILD_DIR="$PROJECT_DIR/dist"
OUTPUT_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
OUTPUT_FILE="$OUTPUT_DIR/deployment-output.json"
PORT="${PORT:-3000}"

cd "$PROJECT_DIR"

if [ -f package.json ]; then
  if [ -f package-lock.json ]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  /usr/bin/time -p npm run build --if-present
fi

# A static project needs a clean deployment copy. Package builds are reused
# when they produced dist/index.html; otherwise fall back to the static copy.
if [ ! -f "$BUILD_DIR/index.html" ]; then
  /usr/bin/time -p rm -rf "$BUILD_DIR"
  /usr/bin/time -p mkdir -p "$BUILD_DIR"
  /usr/bin/time -p cp -R \
    "$PROJECT_DIR/index.html" \
    "$PROJECT_DIR/styles.css" \
    "$PROJECT_DIR/js" \
    "$PROJECT_DIR/assets" \
    "$BUILD_DIR/"
fi

/usr/bin/time -p test -f "$BUILD_DIR/index.html"

/usr/bin/time -p mkdir -p "$OUTPUT_DIR"
/usr/bin/time -p node -e '
  const fs = require("node:fs")
  const [file, project, directory] = process.argv.slice(1)
  fs.writeFileSync(file, JSON.stringify({ project, directory }))
' "$OUTPUT_FILE" "$PROJECT_DIR" "$BUILD_DIR"
/usr/bin/time -p cat "$OUTPUT_FILE"

echo "Serving $BUILD_DIR on 0.0.0.0:$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$BUILD_DIR"
