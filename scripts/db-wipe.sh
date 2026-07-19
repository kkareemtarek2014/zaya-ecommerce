#!/usr/bin/env bash
# Wipe all app data from zaya-db (schema stays; FK-safe child-first order).
# D1 ignores `PRAGMA foreign_keys=OFF`, so deletion ORDER is what matters.
# Only deletes tables that actually exist (local/remote can be on different
# migration levels), so it never fails on "no such table".
#
# Usage:
#   bash scripts/db-wipe.sh --local    # wipe local dev DB
#   bash scripts/db-wipe.sh --remote   # wipe PRODUCTION DB (asks for confirmation)
set -euo pipefail

TARGET="${1:---local}"
if [[ "$TARGET" != "--local" && "$TARGET" != "--remote" ]]; then
  echo "Usage: bash scripts/db-wipe.sh [--local|--remote]" >&2
  exit 1
fi

if [[ "$TARGET" == "--remote" ]]; then
  read -r -p "⚠️  This wipes ALL data in the REMOTE production DB. Type 'wipe' to continue: " ANSWER
  [[ "$ANSWER" == "wipe" ]] || { echo "Aborted."; exit 1; }
fi

echo "→ Listing existing tables ($TARGET)…"
EXISTING="$(pnpm exec wrangler d1 execute zaya-db "$TARGET" --yes --json --command \
  "SELECT name FROM sqlite_master WHERE type='table'" | grep -o '"name": *"[^"]*"' | sed 's/.*: *"//;s/"//')"

# Children first, parents last.
ORDERED_TABLES=(
  payments
  shipments
  order_status_history
  order_items
  promo_redemptions
  inventory_movements
  orders
  product_views
  reviews
  favorites
  waitlist_subscriptions
  wishlist_alerts
  wallet_transactions
  bridal_requests
  addresses
  sessions
  media_assets
  audit_log
  notifications
  webhook_events
  bundles
  products
  categories
  promos
  users
  governorates
  shipping_zones
  settings
  homepage_blocks
  fx_rates
)

SQL=""
for t in "${ORDERED_TABLES[@]}"; do
  if grep -qx "$t" <<< "$EXISTING"; then
    SQL+="DELETE FROM ${t};"$'\n'
  else
    echo "  (skip ${t} — not in this DB)"
  fi
done

if [[ -z "$SQL" ]]; then
  echo "Nothing to wipe."; exit 0
fi

pnpm exec wrangler d1 execute zaya-db "$TARGET" --yes --command "$SQL"
echo "✓ Wipe complete ($TARGET)"
