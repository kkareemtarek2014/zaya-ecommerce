#!/usr/bin/env bash
# Push clean local seed data to remote zaya-db (schema already migrated).
# Exports tables in FK-safe order. No wipe of remote — first seed only (PK conflicts on re-run).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/.wrangler/seed-data.sql"
TMP="${ROOT}/.wrangler/seed-parts"
mkdir -p "$TMP"

# FK-safe order (parents before children)
TABLES=(
  categories
  governorates
  shipping_zones
  settings
  promos
  users
  products
  sessions
  addresses
  favorites
  reviews
  wallet_transactions
  orders
  order_items
  bridal_requests
)

echo "→ Re-seeding local DB (clean baseline)…"
# Clear app tables locally so export matches seed.ts only (ignore errors if empty)
pnpm exec wrangler d1 execute zaya-db --local --yes --command \
  "PRAGMA foreign_keys=OFF;
   DELETE FROM order_items; DELETE FROM orders; DELETE FROM bridal_requests;
   DELETE FROM favorites; DELETE FROM addresses; DELETE FROM reviews;
   DELETE FROM wallet_transactions; DELETE FROM sessions;
   DELETE FROM products; DELETE FROM users; DELETE FROM promos;
   DELETE FROM settings; DELETE FROM shipping_zones; DELETE FROM governorates;
   DELETE FROM categories; PRAGMA foreign_keys=ON;" 2>/dev/null || true

pnpm db:seed

echo "→ Exporting tables in FK-safe order…"
{
  echo "PRAGMA foreign_keys=OFF;"
  for t in "${TABLES[@]}"; do
    PART="$TMP/${t}.sql"
    pnpm exec wrangler d1 export zaya-db --local --no-schema -y --output "$PART" --table "$t" >/dev/null
    # Drop pragma lines from parts; keep INSERTs only
    grep -E '^INSERT ' "$PART" || true
  done
  echo "PRAGMA foreign_keys=ON;"
} > "$OUT"

echo "→ Importing into remote zaya-db ($(wc -l < "$OUT") lines)…"
pnpm exec wrangler d1 execute zaya-db --remote --yes --file "$OUT"

echo "✓ Remote seed complete"
