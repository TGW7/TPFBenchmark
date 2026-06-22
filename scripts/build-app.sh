#!/bin/bash
# Build (or rebuild) HRS.app — the double-clickable preview launcher.
# Bakes the absolute repo path into the AppleScript so the .app works from
# anywhere. Re-run this if you move the repo.
set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/scripts/hrs-launcher.applescript"
OUT="$REPO/HRS.app"

if ! command -v osacompile >/dev/null 2>&1; then
  echo "osacompile not found (macOS only). Cannot build HRS.app." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
sed "s#@@REPO@@#$REPO#g" "$SRC" > "$TMP/HRS.applescript"

rm -rf "$OUT"
osacompile -o "$OUT" "$TMP/HRS.applescript"
chmod +x "$REPO/scripts/launch.command"

echo "✓ Built $OUT"
echo "  repo baked in: $REPO"
echo "  Double-click HRS.app to preview."
