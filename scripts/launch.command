#!/bin/bash
# HRS · Hybrid Readiness Score — preview runner.
# Launched by HRS.app (via Terminal). Close this window to stop the preview.

# Resolve the repo root (this script lives in <repo>/scripts/).
cd "$(dirname "$0")/.." 2>/dev/null || {
  echo "Cannot locate the HRS project folder."; read -n1 -s; exit 1;
}

clear
cat <<'BANNER'
  ┌──────────────────────────────────────────────┐
  │   HRS · Hybrid Readiness Score — preview       │
  └──────────────────────────────────────────────┘
BANNER

# Terminal runs .command files in a login shell, so the user's normal PATH
# (nvm, etc.) is already sourced; prepend the common Homebrew dirs defensively.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm was not found on your PATH."
  echo "Install Node 18+ from https://nodejs.org, then re-open HRS.app."
  echo; echo "Press any key to close…"; read -n1 -s; exit 1
fi

# First run: install dependencies.
if [ ! -d node_modules ]; then
  echo "First run — installing dependencies (this can take a minute)…"
  npm install || { echo "npm install failed."; read -n1 -s; exit 1; }
fi

echo "Starting the dev server — your browser will open automatically."
echo "👉  Close this Terminal window (or press Ctrl-C) to stop the preview."
echo
# exec so Ctrl-C / closing the window stops Vite cleanly. --open launches the
# browser at the correct port once the server is ready.
exec npm run dev -- --open
