#!/usr/bin/env bash
# ────────────────────────────────────────────────────────
# fetch-ctftime-data.sh
# Build-time fetcher for CTFtime API data.
# Saves static JSON files under public/data/ctftime/
# so the static site can read them without CORS issues.
# ────────────────────────────────────────────────────────
set -euo pipefail

OUT_DIR="public/data/ctftime"
mkdir -p "$OUT_DIR"

# CTFtime blocks requests without a browser User-Agent
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

echo "→ Fetching CTFtime team 390903…"
curl -sf -H "User-Agent: $UA" \
  "https://ctftime.org/api/v1/teams/390903/" \
  > "$OUT_DIR/team-390903.json"

echo "→ Fetching international top 100 (2026)…"
curl -sf -H "User-Agent: $UA" \
  "https://ctftime.org/api/v1/top/2026/?limit=100" \
  > "$OUT_DIR/top-2026.json"

echo "→ Fetching country leaderboard (ID)…"
curl -sf -H "User-Agent: $UA" \
  "https://ctftime.org/api/v1/top-by-country/id/?limit=50" \
  > "$OUT_DIR/country-id.json"

echo "✓ CTFtime data saved to $OUT_DIR"
