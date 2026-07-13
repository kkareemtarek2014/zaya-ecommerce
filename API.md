# Zaya API

Live **storefront + admin catalog** HTTP contract for the Cloudflare Worker (`zaya-ecommerce`).
Further admin modules: [`docs/backend/08-admin-dashboard.md`](docs/backend/08-admin-dashboard.md).
Full design notes: [`docs/backend/03-api-contracts.md`](docs/backend/03-api-contracts.md).

**Base URL:** https://zaya-ecommerce.mitchdesigns.workers.dev (or `http://127.0.0.1:8787` via `pnpm preview`).  
**Site URL (SEO / canonicals):** placeholder `https://Zaya-eg.com` in `SITE.url` — update when the real domain is purchased.

---

## Envelope

Every route returns:

```ts
{ ok: true, data: T } | { ok: false, error: { code, message, details? } }
```

| Code | HTTP |
| --- | --- |
| `VALIDATION` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `RATE_LIMITED` | 429 |
| `INTERNAL` | 500 |

Writes are validated with Zod schemas from `src/shared/contracts/` (and feature schemas where reused). Handlers use `withHandler` → envelope mapping.

**Secrets never serialized on storefront:** `basePrice` and `password_hash` / `passwordHash` stay
server-only (`toProductDTO` / `toUserDTO`). Admin catalog DTOs **do** include `basePrice` (whitelist in
`assert:no-secrets`). Run `pnpm assert:no-secrets`.

---

## Auth

Cookie: `zaya_session` (httpOnly, Secure, SameSite=Lax). Passwords: PBKDF2 + pepper.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Rate-limited · auto-login |
| POST | `/api/auth/login` | — | Rate-limited · generic error |
| POST | `/api/auth/logout` | soft | Clears cookie |
| GET | `/api/auth/me` | session | `UserDTO` (no password fields) |
| POST | `/api/auth/forgot-password` | — | Rate-limited · always `{ ok: true }` |

Rate limit (P7): ~20 req / 60s / IP on login, register, forgot (in-memory per isolate).

---

## Catalog

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/products` | — | `?category&featured&sort&q` |
| GET | `/api/products/[id]` | — |
| GET | `/api/products/[id]/related` | — |
| GET | `/api/products/new` | — |
| GET | `/api/products/search` | — |
| GET | `/api/categories` | — |
| GET | `/api/governorates` | — |
| GET | `/api/homepage-blocks` | — | Active blocks ordered by `position` (homepage builder) |

`ProductDTO` includes sell `price` only — never `basePrice`. Lists/search return `published` only;
`GET /api/products/[id]` allows `published` or `hidden` (draft/archived → 404). Checkout requires
`published` and available stock (`stock_qty - reserved_qty`), **or** (when `preorders` flag ON)
`preorder_enabled` + zero available → line flagged `isPreorder` and stock is **not** reserved.
ProductDTO may include `shippingEta`, `fulfilmentType`, `preorderAvailable`, `preorderEtaDays`
(public labels only — never cost inputs).

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/products/[id]/bundles` | — | Bundle hints when `bundles` flag ON |
| POST | `/api/bundles/evaluate` | — | Preview best bundle discount |
| GET | `/api/social-proof` | — | Instagram handle + curated post URLs when `social_proof` ON |

---

## Promo & orders

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/promos/validate` | — |
| POST | `/api/orders` | guest OK (attaches `user_id` if session) |
| GET | `/api/orders` | required |
| GET | `/api/orders/[id]` | public by unguessable id |

Order totals are **server-computed** (prices, shipping zones, free ≥1500 on pre-discount subtotal, promo).
Order DTOs include `timeline[]` (status history from `order_status_history`).
`paymentMethod`: `cod` always; `card`/`wallet` when flag `online_payments` ON **and** Paymob secrets set.

## Payments (Paymob — P13)

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/payments/paymob/intention` | — | `{ orderId }` → `{ clientSecret, publicKey, checkoutUrl, paymentId }` |
| GET | `/api/payments/[orderId]` | — | Poll payment status on confirmation |
| POST | `/api/webhooks/paymob` | HMAC | Source of truth; invalid HMAC → 403; idempotent on `paymob_transaction_id` |

Amounts sent to Paymob in **piasters** (EGP × 100). Browser redirect is UX only.

## Shipping (Bosta — P14)

Flag `bosta_shipping` (default OFF). Requires `BOSTA_API_KEY` (+ `BOSTA_WEBHOOK_SECRET`; optional `BOSTA_BUSINESS_ID`). Use `BOSTA_API_KEY=mock` locally.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/webhooks/bosta?secret=` | secret | Maps Bosta state → order status; idempotent |
| GET | `/api/admin/shipments` | admin | List/filter shipments |
| GET | `/api/admin/orders/[id]/shipment` | admin | Current shipment (`?refresh=1` pulls Bosta) |
| POST | `/api/admin/orders/[id]/shipment` | admin | Create shipment `{ force? }` |

Auto-create (best-effort) runs after COD place and Paymob paid webhook. Order DTOs expose optional `tracking: { number, url, status }`.

## Integrations hardening (P15)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/integrations/status` | `settings:write` | Flag/secret health + issue sample (payment/shipment drift) |
| POST | `/api/admin/jobs/run` | `settings:write` | `{ job: "integrations-reconcile" }` — sync mismatches + refresh open shipments |

`webhook_events` claims `(provider, event_id)` before applying Paymob/Bosta side effects. Live provider calls use 3× exponential backoff on 429/5xx. Hourly cron `0 * * * *` runs reconcile.

---

## Account

All require session.

| Method | Path |
| --- | --- |
| GET/PUT | `/api/account/profile` |
| GET/POST | `/api/account/addresses` |
| DELETE | `/api/account/addresses/[id]` |
| GET/PUT | `/api/account/favorites` |
| GET | `/api/account/wallet` |

Wallet returns **404** while feature flag `wallet` is OFF (same as `/account/wallet` page).

---

## Bridal & reviews

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/bridal-requests` | guest OK | `multipart/form-data`; file ≤25MB image/video → R2; rate-limited |
| GET | `/api/reviews?productId=` | — | summary + items |
| POST | `/api/reviews` | required | No storefront UI yet; recomputes product rating |

---

## Media

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/media/[...key]` | — | Serves R2 object (`products/…`, `categories/…`, bridal uploads) |

---

## Storefront config

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/storefront-config` | — | `{ freeShippingThreshold, shippingZones }` — checkout/cart preview. No `profit_margin`. |

Sell prices use effective `profit_margin` from `settings` (server-only). Shipping totals on orders use DB zone fees + threshold.

---

## Admin (Phase 8–11)

All `/api/admin/**` require a staff session (`requireAdmin` / `requirePermission`). Roles:
`admin | manager | order_manager | product_manager | content_manager` (+ `customer`).
Permissions are code-defined in `src/shared/rbac/` (P21). Last full `admin` cannot be demoted/deleted;
only `admin` may assign `admin`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/health` | Smoke |
| GET | `/api/admin/products` | Paginated `?page&pageSize&q&category&inStock&featured&status&sort` · default excludes `archived` (`status=all` includes) |
| POST | `/api/admin/products` | Create · default `status=draft` · write may set `status`/SEO/`slug`/`sku` · `AdminProductDTO` (+ `basePrice`) |
| GET/PUT/DELETE | `/api/admin/products/[id]` | DELETE → archive; second DELETE on archived → hard delete or `CONFLICT` if in `order_items` |
| POST | `/api/admin/products/[id]/restore` | Restore archived → `draft`, clear `archived_at` |
| POST | `/api/admin/products/[id]/stock` | Adjust stock `{ delta, reason: restock\|adjustment\|return, note? }` · writes `inventory_movements` |
| GET | `/api/admin/products/[id]/inventory` | Movement history (newest first) |
| POST | `/api/admin/products/[id]/duplicate` | Clone as `draft` (new id/slug/SKU, stock 0) |
| POST | `/api/admin/products/bulk` | `{ ids[], action: archive\|publish\|hide\|set-category, payload? }` |
| GET | `/api/admin/products/export` | `?format=csv` product catalog export |
| POST | `/api/admin/products/import` | Multipart CSV → draft upserts + row report |
| GET/POST | `/api/admin/media` | Media library list (paginate/q) / upload image |
| DELETE | `/api/admin/media/[id]` | Guard if URL still referenced by product/category |
| POST | `/api/admin/products/[id]/images` | `multipart` · `file` · image/* ≤5MB |
| DELETE | `/api/admin/products/[id]/images` | JSON `{ url }` |
| GET/POST | `/api/admin/categories` | Full list (incl. `sortOrder`) |
| PUT/DELETE | `/api/admin/categories/[slug]` | DELETE → `CONFLICT` if products remain |
| POST | `/api/admin/categories/[slug]/image` | `multipart` · single `file` |
| GET | `/api/admin/orders` | Paginated `?q&status&governorate&dateFrom&dateTo&page&pageSize` · `AdminOrderDTO` (+ `userId`) |
| GET | `/api/admin/orders/[id]` | Detail with items + `timeline[]` |
| PATCH | `/api/admin/orders/[id]/status` | One-step forward or `cancelled` (not from delivered); writes timeline |
| GET | `/api/admin/shipments` | Paginated Bosta shipments `?q&page&pageSize` |
| GET/POST | `/api/admin/orders/[id]/shipment` | GET current (`?refresh=1`); POST create `{ force? }` · `orders:write` |
| GET | `/api/admin/notifications` | Recent notifications · `?unreadOnly` |
| PATCH | `/api/admin/notifications/[id]/read` | Mark one read |
| POST | `/api/admin/notifications/read-all` | Mark all read |
| GET | `/api/admin/activity` | Friendly recent activity feed (over `audit_log`) |
| GET | `/api/admin/audit-log` | Paginated `?page&pageSize&entity&actorId&dateFrom&dateTo` |
| GET | `/api/admin/users` | Paginated `?q&role&page&pageSize` · `AdminUserDTO` |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Customer 360 detail (`stats`, favorites, addresses); email immutable; self/last-admin guards |
| GET/POST | `/api/admin/governorates` | CRUD · DELETE → `CONFLICT` if orders/addresses reference |
| PUT/DELETE | `/api/admin/governorates/[id]` | |
| GET | `/api/admin/shipping-zones` | Fixed zones |
| PUT | `/api/admin/shipping-zones/[zone]` | `{ fee }` ≥ 0 |
| GET/POST | `/api/admin/promos` | Promo list/create · DTO includes usage + optional `maxRedemptions` |
| PUT/PATCH/DELETE | `/api/admin/promos/[code]` | PATCH `{ active }`; code immutable on PUT |
| GET/POST | `/api/admin/bundles` | Bundles CRUD · `promos:write` · types bxgy\|set\|fixed_price |
| PUT/PATCH/DELETE | `/api/admin/bundles/[id]` | PATCH `{ active }` |
| GET | `/api/admin/bridal-requests` | Paginated `?status&page&pageSize` |
| GET/PATCH | `/api/admin/bridal-requests/[id]` | PATCH `{ status }` |
| GET | `/api/admin/settings` | Pricing + brand + contact/social/SEO + shipping ETA labels + Instagram social-proof + `maintenanceMode` + landed-cost keys + cron timeouts/`cronLastRuns` + `dynamicPricingEnabled` |
| PUT | `/api/admin/settings` | Partial update (pricing writes reprice USD products) |
| POST | `/api/admin/jobs/run` | Manual cron smoke `{ job }` · `settings:write` · includes `fx-rate-refresh` / `landed-cost-reprice` |
| GET/POST | `/api/admin/homepage-blocks` | Homepage builder list/create · `homepage:write` · types hero\|featured\|new_arrivals\|collection\|promo |
| GET/PUT/DELETE | `/api/admin/homepage-blocks/[id]` | Update/delete block |
| POST | `/api/admin/homepage-blocks/reorder` | `{ ids[] }` full ordered list |
| POST | `/api/admin/import/temu` | `{ url, categorySlug?, fulfilmentType? }` → **draft** product · `products:write` · rate-limited · images→R2 |
| GET | `/api/admin/stats` | Dashboard KPIs: revenue today/month/total, AOV, bestSellers, mostViewed, topCategories, newCustomers, … |
| POST | `/api/products/[id]/view` | Increment `product_views` (fire-and-forget OK) |

Cron Triggers (Cloudflare): `*/15 * * * *` unpaid cancel; `0 6 * * *` sessions + reminders + daily
summary + FX refresh; `0 */4 * * *` Temu stock sync. Custom worker: `src/cloudflare-worker.ts`.

All `/api/admin/**` are rate-limited (~60 req/min/IP). Admin mutations write `audit_log` (viewer at
`/admin/activity`). Order status history + notification bell ship in P18.
Maintenance mode (`settings.maintenance_mode`) rewrites storefront pages to `/maintenance` (admins bypass via `/admin/**`).

UI: `/admin/**` through settings + dashboard + activity + homepage builder + bundles (noindex). Flag
`homepage_builder` gates `/admin/homepage`; storefront uses active blocks only when the flag is on
and ≥1 active block exists (else classic hardcoded home). Flags `bundles` / `preorders` /
`social_proof` default OFF — enable in `features.config.ts` to activate storefront behaviors.
Admin orders list accepts `?preorder=1`.

---

## Client usage

```ts
import { api } from '@/shared/lib/api-client';
// credentials: 'include' — session cookie
const products = await api.get<ProductDTO[]>('/api/products');
```

Feature services under `src/features/*/services/` call `api` / `api.postForm` only.

---

## Ops (Phase 7)

```bash
pnpm db:migrate:remote
# after P12: applies audit_log migration too
# set secrets (once): SESSION_SECRET, PASSWORD_PEPPER
pnpm db:seed:remote   # export local seeded data → remote D1 (no wipe)
pnpm run deploy       # note: use `pnpm run deploy` (not bare `pnpm deploy`)
pnpm assert:no-secrets
```

Seeded logins (change before public go-live): `test@example.com` / `password123`, `admin@zaya-eg.com` / `password123`.
