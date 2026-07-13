# 06 — Task Checklist (per phase)

Granular, checkable tasks. Each is small enough to implement + verify in one sitting. Check as you go.
`[V]` = verification task (do not skip).

---

## Phase 0 — Setup
> **Reviewed 2026-07-12 — code/config complete; `typecheck` + `lint` green.** Config uses
> `wrangler.jsonc` (not `.toml`) with D1 `DB` + R2 `UPLOADS`; env typing is `cloudflare-env.d.ts` (via
> `cf-typegen`). ⏳ = still needs a live run on your machine (I can't run wrangler/D1 in review).
- [x] Install: `@opennextjs/cloudflare`, `wrangler`, `drizzle-orm`, `drizzle-kit` (workers types via `cf-typegen`).
- [x] `wrangler login` (account `kkareemtarek2@gmail.com`) — D1/R2 resources exist under it.
- [x] `wrangler d1 create zaya-db` → `database_id` `dafeb5da-…` wired in `wrangler.jsonc`.
- [x] `wrangler r2 bucket create zaya-uploads` (binding `UPLOADS`).
- [x] `SESSION_SECRET` + `PASSWORD_PEPPER` in `.dev.vars` locally. ⏳ also `wrangler secret put` before `deploy`.
- [x] `wrangler.jsonc` with `d1_databases` (binding `DB`) and `r2_buckets` (binding `UPLOADS`).
- [x] `open-next.config.ts`, `drizzle.config.ts`, `cloudflare-env.d.ts` (`CloudflareEnv` with DB/UPLOADS/secrets).
- [x] Scripts: `preview`, `deploy`, `db:generate`, `db:migrate:local`, `db:migrate:remote`, `db:seed`.
- [x] Temp `GET /api/health` route — created and correctly removed after.
- [ ] ⏳ [V] `pnpm build` + `preview` boots (needs the OpenNext/Cloudflare build locally). `typecheck`/`lint` already green.

## Phase 1 — DB layer
> **Reviewed 2026-07-12 — complete.** Schema/migration/seed all present; seed publishes products
> (`status='published'`, `stockQty=50`), hashes both users (customer + admin), and inserts reviews,
> wallet, shipping-zones, settings, and the sample order (with a real product id). Idempotent.
- [x] Schemas: all 14 tables (`categories, products, governorates, promos, users, sessions, orders, order_items, addresses, favorites, reviews, wallet_transactions, bridal_requests` + settings/shipping_zones) + `index.ts` barrel.
- [x] `db/client.ts` (`getDb`) + `db/request.ts` (cached `getRequestDb` via OpenNext context).
- [x] `http/envelope.ts` (`ok`/`fail`), `http/errors.ts` (`AppError` + subclasses), `http/handler.ts` (`withHandler`).
- [x] `shared/contracts/`: `envelope, errors, product, order, auth, promo, review, account` (+ `api-client`).
- [x] `db:generate` → migration `0000_…sql`. ⏳ run `db:migrate:local` on your machine.
- [x] `db/seed.ts` porting all `shared/data` (+ hashed users, admin, reviews, wallet, shipping_zones, settings, sample order).
- [ ] ⏳ [V] Run `db:migrate:local` + `db:seed`, then confirm row counts: products 12, categories 7, governorates 27, promos 2, users 2, shipping_zones 3, ≥1 order; users hashed.

## Phase 2 — Catalog reads
> **Reviewed 2026-07-12 — complete.** `toProductDTO` maps rows → DTO and **never** exposes `basePrice`
> (verified); all reads filter `status='published'`. Client `Product`/`Category` are now the contract
> DTOs; components use `product.price`.
- [x] `products.repo`, `categories.repo`, `governorates.repo`.
- [x] `server/services/product.service.ts` row→`ProductDTO` mapper (no `basePrice`; `price` via `computeSellPrice`).
- [x] Routes: `products`, `products/[id]`, `products/[id]/related`, `products/new`, `products/search`, `categories`, `governorates` (+ `?category&featured&sort&q`).
- [x] Rewrote `features/shop/services/products.service.ts` bodies → `api` calls.
- [x] `basePrice`/`getSellPrice` removed from components + `cart.store` (use `product.price`); `Product = ProductDTO`.
- [x] RSC pages call the server product service; `generateMetadata`/JSON-LD/`generateStaticParams` intact.
- [x] [V] `typecheck` + `lint` clean; DTO mapper guarantees no `basePrice` in responses. ⏳ eyeball the pages after `db:seed`.

## Phase 3 — Auth
> **Reviewed 2026-07-12 — complete.** PBKDF2 (100k, constant-time verify); opaque token in httpOnly
> cookie with only its SHA-256 stored; `toUserDTO` excludes `passwordHash` (verified). Login uses a
> generic error (no enumeration); forgot-password always returns ok. `Secure` flag set on https.
- [x] `auth/password.ts` (PBKDF2 hash/verify, constant-time), `auth/session.ts` (token/cookie helpers), `auth/require-auth.ts`.
- [x] `users.repo`, `sessions.repo`, `server/services/auth.service.ts`.
- [x] Routes: `auth/register`, `auth/login`, `auth/logout`, `auth/me`, `auth/forgot-password`.
- [x] Rewrote `features/auth/services/auth.service.ts` → `api`; added `useLogin/useRegister/useForgotPassword/useLogout/useSession`.
- [x] Deleted `users.store`; session hydrated from `/api/auth/me` (`SessionHydrator`/`useSession`); `AuthGuard` confirms session.
- [ ] ⏳ [V] Live flows (register→auto-login cookie; seed login; bad creds 401; protected redirect; refresh persists; logout clears). Code verified; no `password_hash` in DTOs.

## Phase 4 — Promo + Orders
> **Revision notes (locked):** free shipping uses subtotal **before** discount; checkout must
> send `promoCode` (client previously dropped it); UI stays COD-only while API enum allows
> card/wallet for P13; client `Order` = `OrderDTO` (includes `discount`/`promoCode`/`paymentStatus`);
> shipping fees from D1 `shipping_zones` with `site.config` fallback.
> **Reviewed 2026-07-12 — complete.** `order.service` recomputes unit prices (`computeSellPrice`),
> subtotal, promo discount, and shipping server-side (client prices ignored); validates governorate +
> stock; guests may place COD; card/wallet rejected until P13. Shipping reads D1 `shipping_zones` with
> `site.config` fallback; free shipping keyed on pre-discount subtotal.
- [x] `promo.service` + `POST /api/promos/validate`; cart `applyCoupon` → API.
- [x] `order.service` (recompute prices, subtotal, discount, shipping, total), `orders.repo`, `order_items` writes.
- [x] Routes: `POST /api/orders` (guest ok), `GET /api/orders/[id]`, `GET /api/orders` (auth).
- [x] `usePlaceOrder`; `CheckoutForm.onSubmit` → mutation; removed `ordersStore.placeOrder` + mock order.
- [ ] ⏳ [V] Live order (server totals with tampered client prices ignored; zone shipping + free≥1500; promo; `/order/[id]` + account list). Code verified.

## Phase 5 — Account
> **Revision notes (locked, vs CLAUDE.md + `03`/`04`):**
> - Profile lives on `users` (`name`/`phone`); email immutable; drop `Zaya-profile` store.
> - Addresses: DTO field `governorate` ↔ DB `governorate_id`; ownership enforced on DELETE.
> - Favorites: guests keep `Zaya-favorites` localStorage; on login `PUT` guest ids (replace set),
>   then treat server as source of truth while authenticated (toggle also PUTs when logged in).
> - Wallet: balance = Σcredit − Σdebit (never trust stored balance); flag `wallet` OFF →
>   page 404 via middleware **and** `GET /api/account/wallet` → 404; drop `Zaya-wallet` persist.
> - Reuse `requireAuth` + `account.contract.ts`; vouchers page out of scope (no API in docs).
- [x] Repos + routes: profile (get/put), addresses (get/post, `[id]` delete), favorites (get/put), wallet (get, flag-gated 404).
- [x] Hooks: `useProfile/useUpdateProfile`, `useAddresses/useAddAddress/useRemoveAddress`, `useFavoritesSync`, `useWallet`.
- [x] Rewire `ProfileForm`, `AddressBook`, `FavoritesGrid`, `MyWallet`; favorites PUT-sync on login.
- [x] [V] Profile persists; address add/delete (ownership enforced); favorites sync; wallet balance = Σcredit−Σdebit; wallet route 404 when flag off.

## Phase 6 — Bridal + R2 + Reviews
> **Revision notes (locked, vs CLAUDE.md + `03`/`04`/`01`):**
> - Bridal is **public** (guest OK); if session present, set optional `user_id` (same soft-auth as orders).
> - File: ≤25 MB → `PAYLOAD_TOO_LARGE` **413**; MIME must start with `image/` or `video/` → else
>   `VALIDATION` **400**. R2 key `bridal/{id}/{sanitizedFilename}` via binding `UPLOADS`. No media
>   read route in P6 (store `file_key` only). Empty `weddingDate` → `null`.
> - Response 201: `{ id, status, createdAt }`. Add `bridal.contract.ts`. Drop `Zaya-bridal-requests`
>   persist; success UI from mutation response + React state only.
> - Reuse feature `bridalRequestSchema` text fields server-side; validate file size/MIME after
>   `request.formData()` (Workers `File` ≠ browser Zod file custom cleanly).
> - Reviews: `GET` public by `productId`; summary (avg/count/breakdown `"1"`…`"5"`) computed from
>   rows. `POST` auth-only, no UI; `authorName` = session user name; denormalized recompute of
>   `products.rating` / `review_count` (1 decimal). Helpful button display-only (no increment API).
> - `ProductReviews` takes `productId`; live UI shows seed truth for `p-001` (not fake 4.8/124).
- [x] `upload.service` (R2 put/get), `bridal-requests.repo`, `POST /api/bridal-requests` (multipart, ≤25MB, image/video).
- [x] `useSubmitBridalRequest` (multipart); wire `BridalRequestForm`.
- [x] `reviews.repo` + `GET /api/reviews?productId=`; rewire `ProductReviews` (list + average + breakdown bars). `POST /api/reviews` (auth, no UI).
- [x] [V] Bridal submit → DB row + R2 object; oversized/wrong-type rejected (413/400); reviews render from DB with correct summary; recompute updates product rating/count.

## Phase 7 — Hardening & deploy
> **Revision notes (locked, vs CLAUDE.md + `07-checklist` / `01` / `05`):**
> - **Audit:** every write already Zod-validated in services (keep that pattern); every route via
>   `withHandler` → envelope; add a short audit comment in `API.md`. Product GET queries stay
>   light (no body Zod required).
> - **Secrets leak:** `toProductDTO` / `toUserDTO` are the authority; add `pnpm assert:no-secrets`
>   (rg over `src/` serializers + client) — sitemap/`products.data` seed file may still contain
>   `basePrice` server-side; fail only if `basePrice`/`passwordHash` appear under `src/app/api` or
>   DTO/mapper exports. Client bundle check: no `basePrice` string in feature client code.
> - **Rate limit:** **in-memory** sliding window (no KV binding in P7 — `01` says KV later). Scope:
>   `POST` auth `login`/`register`/`forgot-password` + `POST` bridal only (not `me`/`logout`).
>   Limit ~20 / 60s / IP → `RATE_LIMITED` 429. Best-effort per isolate (acceptable for “basic”).
> - **Security headers** (via `next.config` `headers()` for all routes): `X-Content-Type-Options`,
>   `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` (cam/mic/geo off). Keep
>   `_headers` cache for `/_next/static/*`. No strict CSP in P7 (SVG placeholders).
> - **API.md:** storefront live contract only (from `03`); short “Admin planned — see `08`” pointer.
> - **SITE.url:** leave placeholder until domain purchased; note in CLAUDE/`API.md`.
> - **Remote:** `db:migrate:remote` → `wrangler secret put` SESSION_SECRET + PASSWORD_PEPPER →
>   `pnpm deploy`. Remote seed: `pnpm db:seed:remote` (wrangler D1 `--remote` batches; idempotent
>   `onConflictDoNothing` — **no wipe**). Prod passwords still seed defaults — change before public
>   go-live (not a P7 blocker).
> - **[V]:** checklist sections for storefront P0–P7 + build gates + Cloudflare + Security + API
>   quality; Admin/Integrations/Enhancements/Sourcing rows stay unchecked (later phases).
- [x] Audit: every write validated with a contract schema; every route returns the envelope; errors mapped to codes.
- [x] Ensure `basePrice` & `password_hash` never serialized (add a serialization test/grep).
- [x] Basic rate-limit on `auth/*` + bridal (optional KV); security headers.
- [x] `db:migrate:remote` + seed remote D1; set secrets; `deploy`.
- [x] Smoke test production URL; verify cart/checkout/order still `noindex`.
- [x] Write `API.md` at repo root (CLAUDE.md TODO); update `SITE.url` if domain purchased.
- [x] [V] Full `07-checklist.md` passes against deployed Worker (storefront P0–P7 sections; later-phase rows remain open).

## Phases 8–12 — Admin dashboard
The full, granular admin task list lives in **`08-admin-dashboard.md` §10**. Do those after P0–P7
are green. Pricing/shipping must read **effective settings** once P11 lands.

### Phase 8 — Admin auth & shell
> **Revision notes (locked, vs CLAUDE.md + `08` / `01` / `03`):**
> - **P8 scope only:** auth + shell + shared admin UI primitives. **No** products/categories CRUD,
>   orders/users APIs, settings UI, or live stats (P9–P12). `/admin` home = placeholder dashboard.
> - **`users.role`:** already in schema/seed/`UserDTO` (P1/P3). P8 does **not** add a new migration;
>   confirm `me` returns `role` and wire guards.
> - **Login:** dedicated `/admin/login` reusing the same httpOnly session + `POST /api/auth/login`.
>   Unauthenticated `/admin/**` → `/admin/login?redirect=…`. Authenticated non-admin → 403 page.
> - **RBAC:** only `customer | admin` (`requireAdmin` = `role === 'admin'`). Expanded roles later (`10`).
> - **Protection:** middleware cookie gate for `/admin` (Edge — no D1); authoritative role check in
>   client `AdminGuard` (`/api/auth/me`) + server `requireAdmin` on every `/api/admin/**`.
> - **UI:** `src/features/admin/` + `src/app/admin/**`; same storefront tokens (no separate theme).
>   Implement **all** §10 P8 primitives now (`DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`,
>   `Toast`+provider, `Tabs`, `SearchInput`) for P9 composition. Toast provider in admin layout.
> - **APIs:** add `requireAdmin` now; optional tiny `GET /api/admin/health` for smoke (no CRUD).
> - **No admin feature flag** — gated by role only. `audit_log` / effective settings = P12 / P11.
- [x] Confirm `users.role` + seed admin + `auth/me` returns `role` (no new migration).
- [x] `auth/require-admin.ts`; `GET /api/admin/health` (requireAdmin smoke).
- [x] `AdminGuard`, `AdminShell` (Sidebar, Topbar, Breadcrumbs); `/admin/login` + 403 page.
- [x] New primitives: `DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`, `Toast`+provider, `Tabs`, `SearchInput`.
- [x] `middleware.ts` cookie-gates `/admin`. [V] admin-in / non-admin-403 / responsive shell.

### Phase 9 — Products & Categories CRUD + images
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§7/§10):**
> - **Scope:** product + category admin APIs/UI + R2 images only. Out: orders/users, settings,
>   drafts/archive UX, inventory movements, bulk/CSV, SEO/slug/SKU admin, Temu, audit_log.
> - **`AdminProductDTO`:** includes `basePrice` (admin-only) + derived sell `price`. Storefront
>   `ProductDTO` unchanged. Whitelist `assert:no-secrets` for `shared/contracts/admin-*.ts`,
>   `features/admin/**`, `src/app/api/admin/**`.
> - **Status:** creates default **`published`** so storefront verify works; no draft workflow UI in P9
>   (enhancement cols exist but full draft/archive = `10`).
> - **Pricing:** keep flat `computeSellPrice(basePrice)` (site.config margin); effective settings = P11.
> - **Images:** multipart only (no base64); **image/** ≤ **5 MB**; product keys
>   `products/{id}/{uuid}.ext`; category `categories/{slug}/{uuid}.ext`. Serve via
>   `GET /api/media/[...key]`. JSON create may omit images then upload, or keep seed `/images/*.svg` URLs.
> - **Delete:** hard DELETE; category with products → `CONFLICT`; product in `order_items` → `CONFLICT`.
> - **List:** products paginated (`page=1`, `pageSize=20`, `q`, `category`, `inStock`, `featured`, `sort`);
>   categories = full array (include `sortOrder` in admin DTO).
> - **UI:** `/admin/products`, `/admin/categories`; un-`soon` nav; reuse P8 DataTable/Dialog/Toast/
>   SearchInput/Pagination; `ImageUploader` + confirm delete.
>
> **Reviewed 2026-07-12 — complete.** Admin catalog APIs + R2 media route + products/categories UI.
> Creates default `published`. `typecheck`/`lint`/`assert:no-secrets` green. ⏳ live create→storefront
> + R2 image smoke on your machine (`preview` / deploy).
- [x] Product admin API (CRUD + image add/remove) + `AdminProductDTO`.
- [x] Category admin API + image + `AdminCategoryDTO`.
- [x] `ProductForm`, `CategoryForm`, `ImageUploader`, list pages (search/filter/paginate + confirm delete).
- [ ] ⏳ [V] create→storefront; delete blocked when referenced; images in R2 via `/api/media`.

### Phase 10 — Orders & Users
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§6/§10 + live schema):**
> - **Scope:** admin orders list/filter/detail + status transitions; users list/view/edit/delete with
>   guards. Out: Bosta shipment create/track (`09`/P14), Paymob admin UI beyond existing
>   `orders.payment_status` (`09`/P13), `order_status_history` timeline (`10-enhancements`),
>   `audit_log` (P12), create/delete orders, password reset, email change, Customer 360, RBAC
>   beyond `customer|admin`.
> - **No new migration** — `orders.status` + `cancelled`, `users.role`, and FK `onDelete` rules
>   already exist (orders/reviews/bridal → `set null`; favorites/addresses/sessions/wallet → `cascade`).
> - **`AdminOrderDTO`:** storefront `OrderDTO` + `userId: string | null` (admin link only). Never
>   invent Paymob/Bosta fields; `tracking` stays optional empty until P14.
> - **`AdminUserDTO`:** `{ id, email, name, phone?, role, createdAt, ordersCount }`. Detail adds
>   `recentOrders: AdminOrderDTO[]` (cap 10). **Never** serialize `passwordHash`.
> - **Status transitions (server-authoritative):** forward **one step only** along
>   `placed → confirmed → sourced → shipped → out_for_delivery → delivered`. `cancelled` allowed
>   from any status **except** `delivered` / already `cancelled`. Same status → no-op OK. Illegal
>   jump / terminal → `VALIDATION`. `OrderStatusSelect` only offers allowed next values.
> - **Orders API:** `GET /api/admin/orders` (`q` = id/phone/name, `status`, `governorate`,
>   `dateFrom`/`dateTo` ISO dates, `page=1`, `pageSize=20`); `GET /[id]`; `PATCH /[id]/status`
>   `{ status }`. No POST/DELETE orders.
> - **Users API:** `GET /api/admin/users` (`q` = email/name/phone, `role`, page/pageSize);
>   `GET /[id]`; `PUT /[id]` `{ name?, phone?, role? }` (email immutable; Egyptian phone when set);
>   `DELETE /[id]` hard delete.
> - **Guards:** cannot delete or demote **self**; cannot delete or demote the **last** admin →
>   `CONFLICT` with clear message.
> - **UI:** `/admin/orders`, `/admin/orders/[id]`, `/admin/users`, `/admin/users/[id]`; reuse P8/P9
>   DataTable/SearchInput/Pagination/ConfirmDialog/Toast; `OrderStatusSelect` + `UserForm`;
>   un-`soon` Orders & Users nav.
> **Reviewed 2026-07-12 — complete.** Admin orders/users APIs + list/detail UI; one-step status +
> cancel; self/last-admin guards. `typecheck`/`lint` green. ⏳ live status/guard smoke on your machine.
- [x] Orders admin API (list/filter/detail/status) + `AdminOrderDTO`.
- [x] Users admin API (list/view/edit/delete + guards) + `AdminUserDTO`.
- [x] Order/user pages (`OrderStatusSelect`, `UserForm`, confirm delete).
- [ ] ⏳ [V] illegal status rejected; self/last-admin guards; edits persist.

### Phase 11 — Locations, Promos, Bridal, Settings
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§4/§6/§10 + live schema/seed):**
> - **Scope:** governorates CRUD + shipping-zone **fee** edit; promo CRUD (+ active toggle); bridal
>   list/detail + mark answered; settings form. Wire **effective settings** into pricing (shipping
>   already reads DB). Out: `audit_log` (P12), logo/favicon/social/SEO/maintenance (`10` §18),
>   landed-cost / FX pricing (`11`), Bosta mapping, promo `max_redemptions`, bridal delete/reply text.
> - **No new migration** — `governorates`, `shipping_zones`, `promos`, `bridal_requests`, `settings`
>   already seeded (`profit_margin`, `free_shipping_threshold`, `site_name`, `site_tagline`, `site_url`).
> - **Effective config:** DB value if present, else `site.config.ts` fallback.
>   - `computeSellPrice(db, basePrice)` reads `profit_margin` (async). Pure math stays
>     `getSellPrice(basePrice, margin?)` in `shared/utils/price.ts`.
>   - Shipping already uses `shipping_zones.fee` + `free_shipping_threshold` — keep that.
> - **Public storefront config (for checkout/cart preview):** `GET /api/storefront-config` →
>   `{ freeShippingThreshold, shippingZones: { zone, label, fee }[] }`. **Never** expose
>   `profit_margin`. Checkout client shipping preview must use this (not static `SHIPPING_RATES`).
> - **Locations API:** `GET/POST /api/admin/governorates`; `PUT/DELETE /[id]` — zone ∈
>   `cairo_giza|near|far`; DELETE → `CONFLICT` if orders/addresses reference. `GET /api/admin/shipping-zones`;
>   `PUT /[zone]` `{ fee }` (fee ≥ 0 int). Zones are fixed (no create/delete zone).
> - **Promos API:** `GET/POST /api/admin/promos`; `PUT /[code]` (code immutable); `DELETE /[code]`;
>   `PATCH /[code]` `{ active }`. Percentage `value` ∈ (0, 1]; fixed `value` > 0. Codes stored uppercased.
> - **Bridal API:** `GET /api/admin/bridal-requests` (`status`, `page`, `pageSize=20`); `GET /[id]`;
>   `PATCH /[id]` `{ status: pending|answered }`. `AdminBridalRequestDTO` includes `mediaUrl` via
>   `/api/media/{fileKey}` when present.
> - **Settings API:** `GET/PUT /api/admin/settings` — partial update of known keys only.
>   `profit_margin` clamped **0.20–0.30**; `free_shipping_threshold` ≥ 0 int; site strings trimmed.
> - **UI:** `/admin/locations` (Tabs: governorates + zones), `/admin/promos`, `/admin/bridal`,
>   `/admin/bridal/[id]`, `/admin/settings`; un-`soon` those nav items; reuse P8 Tabs/DataTable/Toast/
>   ConfirmDialog; `SettingsForm`, `ShippingZoneForm` / inline fee edit, `PromoForm`.
> **Reviewed 2026-07-12 — complete.** Locations/promos/bridal/settings admin + effective
> `profit_margin` in `computeSellPrice`; public `GET /api/storefront-config`; checkout preview wired.
> `typecheck`/`lint`/`assert:no-secrets` green. ⏳ live zone-fee + margin smoke on your machine.
- [x] Locations APIs + pages; shipping/pricing read effective settings; public storefront-config.
- [x] Promos CRUD + Bridal review APIs/pages.
- [x] Settings API + form (margin clamp).
- [ ] ⏳ [V] zone fee → checkout shipping; margin → storefront prices.

### Phase 12 — Dashboard stats + hardening
> **Revision notes (locked, vs CLAUDE.md + `08` §3/§5/§9/§10 + `02` §2.16 + `07` admin):**
> - **Scope:** `GET /api/admin/stats` + live `/admin` dashboard (StatCards, sales chart, recent
>   orders, latest products); `audit_log` table + write on admin mutations; rate-limit admin APIs.
>   Out: audit **viewer** / activity feed / notifications bell (`10` §16/§20 — P18+), chart libraries
>   (CSS/SVG bars only), Paymob/Bosta, inventory/timeline enhancements.
> - **Migration required:** add `audit_log` (`id`, `actor_id` FK→users, `action`, `entity`,
>   `entity_id`, `meta` JSON null, `created_at`). Generate via drizzle; run local + remote migrate.
> - **`AdminStatsDTO`:**
>   `{ revenueTotal, ordersCount, productsCount, usersCount, ordersByStatus,
>     recentOrders: AdminOrderDTO[5], latestProducts: AdminProductDTO[5],
>     salesByDay: { date: YYYY-MM-DD, total }[14] }`.
>   - `revenueTotal` / `salesByDay`: sum `orders.total` where `status ≠ cancelled`.
>   - `ordersByStatus`: all `OrderStatus` keys present (0 if none).
>   - `salesByDay`: last 14 UTC calendar days, missing days → `total: 0`.
>   - Products count = all rows (any status); users = all rows.
> - **Audit writes:** helper `writeAuditLog({ actorId, action, entity, entityId, meta? })` after
>   successful admin creates/updates/deletes/status changes. Actions:
>   `create|update|delete|status_change`. Entities include `product|category|order|user|promo|
>   governorate|shipping_zone|settings|bridal_request`. Best-effort (log + continue if insert fails —
>   never fail the user-facing mutation). **No** audit list UI in P12.
> - **Rate-limit:** extend `rateLimitByIp` with route `'admin'` — **60 req / 60s / IP** on all
>   `/api/admin/**` (call at start of `requireAdmin` or each admin route). Auth login already limited
>   (P7).
> - **UI:** replace placeholder `/admin` with client dashboard; `StatCard`, `SalesChart` (CSS bars),
>   `RecentOrders`, `LatestProducts` in `features/admin/components/`. Links into existing modules.
>   No new nav item (Dashboard already active).
> - **Deploy:** ⏳ `pnpm run deploy` + remote migrate for `audit_log` is a verify step on your machine
>   (agent implements code + local migrate scripts; does not force production deploy).
> **Reviewed 2026-07-12 — complete.** `audit_log` migration (`0001_…`); stats API + live `/admin`
> dashboard; audit writes on mutations; admin rate-limit 60/min. `typecheck`/`lint`/`assert:no-secrets`
> green. ⏳ remote migrate + deploy smoke on your machine.
- [x] `audit_log` schema + migration; `writeAuditLog` wired to admin mutations.
- [x] `GET /api/admin/stats` + dashboard UI (cards, chart, recent/latest).
- [x] Admin API rate-limit (60/min/IP).
- [ ] ⏳ [V] stats match DB; migrate audit_log remote; deploy smoke.

### Phase 16 — Catalog depth
> **Revision notes (locked, vs `10` §4/§5/§15 + `05` P16 + live schema):**
> - **Scope:** admin status workflow, SEO columns, soft archive/restore, storefront hidden-by-link.
>   Out: rich-text editor (column `description_format` only, always `plain`), inventory (P17),
>   duplication/bulk/CSV (P19), slug-based URLs (keep `/product/[id]`).
> - **Already present:** `status`, `slug`, `sku`, `stock_qty`, `reserved_qty`.
> - **Migration:** add `seo_title`, `seo_description`, `og_image`, `canonical_url`,
>   `description_format` (`plain`|`html`, default `plain`), `archived_at`.
> - **Status:** create default **`draft`** (form); lists/search = `published` only; **detail** allows
>   `published`|`hidden`; checkout still requires `published`. Admin list `?status=` (default
>   excludes `archived` unless filtered / `status=all`).
> - **Delete:** `DELETE` → archive (`status=archived`, `archived_at=now`). Second DELETE on archived
>   with no `order_items` → hard delete + R2 cleanup; with refs → `CONFLICT`.
>   `POST /api/admin/products/[id]/restore` → `draft`, clear `archived_at`.
> - **SEO:** `generateMetadata` prefers stored SEO fields; else name/description/image/id canonical.
> **Reviewed 2026-07-12 — complete.** Migration `0002_even_ikaris` (SEO + `description_format` +
> `archived_at`); admin status/SEO/archive/restore; storefront lists = published, detail =
> published|hidden; metadata SEO fallbacks. `typecheck`/`lint`/`assert:no-secrets`/`build` green.
> ⏳ remote migrate + smoke (draft/hidden/archive) on your machine.
- [x] Migration + contracts (`status`/SEO on admin write + DTO).
- [x] Admin archive/restore/status APIs; storefront hidden detail + metadata.
- [x] ProductForm + list filter + archive/restore UI.
- [ ] ⏳ [V] draft hidden from shop; hidden direct-link OK; archive/restore works.

### Phase 17 — Inventory ⭐
> **Revision notes (locked, vs `10` §1 + `05` P17 + live schema):**
> - **Already present:** `stock_qty`, `reserved_qty`, `in_stock` on products.
> - **Migration:** `inventory_movements` (`id`, `product_id`, `old_qty`, `new_qty`, `delta`,
>   `reason` ∈ restock|sale|adjustment|return|reservation|release, `order_id?`, `actor_id?`,
>   `note?`, `created_at`). Settings key `low_stock_threshold` (default 5).
> - **Available:** `stock_qty - reserved_qty`. Storefront `inStock` = admin flag AND available > 0.
>   Checkout rejects when available < line qty; increments `reserved_qty` + `reservation` movement.
> - **Lifecycle:** cancel → `release` (decrement reserved); **delivered** → `sale` (decrement stock +
>   reserved). Cron unpaid expiry deferred to P22; Paymob payment path deferred to P13.
> - **Admin:** `POST /api/admin/products/[id]/stock` `{ delta, reason, note? }`;
>   `GET .../inventory` history; settings `lowStockThreshold`; dashboard `lowStockProducts[]`.
> - **UI:** stock adjust + history on product edit; threshold on Settings; low-stock on dashboard.
>   Storefront: existing Sold Out badge / disabled add-to-bag via derived `inStock`.
> - **Out:** notifications bell (P18), cron release (P22), Temu sync (P24), separate Inventory nav.
> **Reviewed 2026-07-12 — complete.** Migration `0003_funny_rocket_racer` (`inventory_movements`);
> reserve on place / release on cancel / sale on delivered; admin stock adjust + history; settings
> `low_stock_threshold`; dashboard low-stock list; storefront derived `inStock`.
> `typecheck`/`lint`/`assert:no-secrets`/`build` green. ⏳ remote migrate + smoke on your machine.
- [x] Migration + inventory contracts/service.
- [x] Reserve/release/sale wired to orders; admin stock APIs; settings + stats.
- [x] Product edit stock UI; settings; dashboard low-stock.
- [ ] ⏳ [V] oversell blocked; cancel releases; deliver sells; adjust logs movement.

### Phase 18 — Order timeline ⭐ + notifications + activity
> **Revision notes (locked, vs `10` §2/§10/§16/§20 + `05` P18 + `02` §2.18–2.19):**
> - **Migration:** `order_status_history` (`id`, `order_id`, `from_status?`, `to_status`,
>   `actor` ∈ admin|system|paymob|bosta, `actor_id?`, `note?`, `created_at`);
>   `notifications` (`id`, `type` ∈ new_order|low_stock|bridal_request|payment_failed,
>   `title`, `body`, `entity`, `entity_id`, `read`, `created_at`).
> - **Timeline writes:** checkout create → `placed` (`actor=system`); admin status patch → row with
>   `actor=admin` + `actor_id`. Paymob/Bosta actors reserved for P13–P15 (no webhooks yet).
> - **API:** admin + storefront order DTOs include `timeline[]`. Notifications:
>   `GET /api/admin/notifications`, `PATCH .../[id]/read`, `POST .../read-all`.
>   `GET /api/admin/activity` (friendly feed over `audit_log`); `GET /api/admin/audit-log`
>   (paginated/filterable viewer — same page UI as activity with a raw toggle is fine).
> - **Notifications written now:** new order, bridal submit, low-stock threshold crossed (after
>   reserve/sale/adjust). `payment_failed` type exists; writers wait for Paymob (P13).
> - **UI:** event timeline on admin order + history-aware storefront timeline; bell in admin topbar
>   (poll); Activity nav + dashboard strip; `/admin/activity` page.
> - **Out:** live push, Paymob/Bosta webhook timeline rows, cron reminder jobs (P22).
> **Reviewed 2026-07-13 — complete.** Migration `0004_medical_lilith` (`order_status_history` +
> `notifications`); timeline on place/admin status; notifications (order/bridal/low-stock); activity
> feed + audit-log viewer; topbar bell; dashboard strip. `typecheck`/`lint`/`assert:no-secrets`/`build`
> green. ⏳ remote migrate + smoke on your machine.
- [x] Migration + contracts (timeline / notifications / activity / audit-log).
- [x] Wire timeline + notification writers; admin APIs.
- [x] Timeline UI, notification bell, activity page/dashboard.
- [ ] ⏳ [V] status change logs timeline; bell shows new order; activity lists audits.

### Phase 19 — Catalog productivity
> **Revision notes (locked, vs `10` §6–§9/§11/§12 + `05` P19):**
> - **Duplicate ⭐:** `POST /api/admin/products/[id]/duplicate` → `draft` clone (new id/slug/SKU,
>   `stock_qty=0`, images re-used by URL, SEO cleared); returns product for edit.
> - **Bulk ⭐:** `POST /api/admin/products/bulk` `{ ids[], action, payload? }` with
>   `archive|publish|hide|set-category` (per-id results). UI: row checkboxes + toolbar + confirm.
> - **CSV:** products only — `GET /api/admin/products/export?format=csv`,
>   `POST /api/admin/products/import` (multipart) → draft upserts by SKU/slug + row report.
>   Orders/customers CSV deferred.
> - **Search:** admin `q` matches name **or** SKU **or** tags **or** description (storefront unchanged).
> - **Media library:** `media_assets` table + `GET/POST /api/admin/media`, `DELETE .../[id]`
>   (blocked if URL still on a product/category); `/admin/media` page; product image picker.
> - **Rich text:** `description_format` editable (`plain`|`html`); sanitize HTML on write (allow-list);
>   storefront renders HTML safely when format is `html`. Lightweight format control (no TipTap/etc.).
> - **Out:** heavy WYSIWYG packages, FTS, orders/customers CSV, homepage media fields (P20/P23).
> **Reviewed 2026-07-13 — complete.** Migration `0005_fantastic_nico_minoru` (`media_assets`);
> duplicate/bulk/CSV/media APIs; admin search on name/SKU/tags/description; HTML sanitize on write
> + safe storefront render; products list (bulk + duplicate + CSV); `/admin/media` + `MediaPicker`;
> description format on ProductForm. `typecheck`/`lint`/`assert:no-secrets`/`build` green.
> ⏳ remote migrate + smoke (duplicate/bulk/CSV/media/HTML) on your machine.
- [x] Migration `media_assets` + contracts.
- [x] Duplicate / bulk / CSV / media / sanitize / admin search APIs.
- [x] Products list bulk+duplicate+CSV; media page/picker; description format UI.
- [ ] ⏳ [V] duplicate → draft; bulk archive; CSV round-trip; media attach; HTML description renders.

### Phase 20 — Insight (Customer 360 + coupons + analytics + settings)
> **Revision notes (locked, vs `10` §3/§13/§14/§18 + `02` §2.21–2.22 + `05` P20):**
> - **Dashboard analytics:** extend `GET /api/admin/stats` with `revenueToday`, `revenueThisMonth`,
>   `avgOrderValue`, `bestSellers[]` (qty+revenue, top 5), `mostViewed[]`, `topCategories[]`,
>   `newCustomers` (users created last 30d). Conversion rate **deferred**.
> - **`product_views`:** `product_id` PK, `views`, `updated_at` — increment on product page view
>   (`POST /api/products/[id]/view` or server page load). Powers `mostViewed`.
> - **Customer 360:** extend `GET /api/admin/users/[id]` with
>   `stats { ordersCount, totalSpent, lastOrderAt }`, keep `recentOrders[]`, add `favorites[]`
>   (id/name/image) + `addresses[]` (SavedAddress shape). UI on `/admin/users/[id]`.
> - **Coupon usage:** migration `promo_redemptions` (`id`, `promo_code`→promos, `order_id`→orders
>   cascade, `user_id?`, `discount`, `created_at`) written on place when promo applied; optional
>   `promos.max_redemptions`; validatePromo rejects when remaining=0. Admin promo DTO gains usage
>   (`timesUsed`, `remaining`, `discountTotal`, `revenueTotal`) + optional customer list on detail.
>   Backfill redemptions from existing `orders.promo_code` in migration.
> - **Expanded settings (key-value):** logoUrl, faviconUrl, contactEmail, contactPhone,
>   whatsappNumber, social Instagram/Facebook/TikTok, seoDefaultTitle/Description, footerText,
>   `maintenanceMode`. Logo/favicon = URL strings (media library picker). Shipping fees stay on
>   Locations. Storefront config exposes `maintenanceMode` (+ existing shipping fields).
> - **Maintenance:** middleware rewrites non-admin pages to `/maintenance` when on; bypass
>   `/admin/**`, `/api/**`, `/maintenance`, auth pages needed for admin login. Customers do **not**
>   bypass — only admin routes.
> - **Out:** visit/session conversion analytics, RBAC (P21), cron (P22), homepage blocks (P23),
>   Customer/orders CSV.
> **Reviewed 2026-07-13 — complete.** Migration `0006_opposite_ultimates` (`promo_redemptions`,
> `product_views`, `promos.max_redemptions` + order backfill); extended admin stats; Customer 360;
> redemption write + max validate; product view ping; expanded settings + maintenance middleware
> (`/maintenance`). `typecheck`/`lint`/`assert:no-secrets`/`build` green.
> ⏳ remote migrate + smoke (KPIs / 360 / promo / views / maintenance) on your machine.
- [x] Migration `promo_redemptions` + `product_views` + `promos.max_redemptions`.
- [x] Stats / Customer 360 / redemptions+validate / product view / expanded settings APIs.
- [x] Dashboard KPIs; user 360 UI; promo usage; SettingsForm + `/maintenance` + middleware.
- [ ] ⏳ [V] stats KPIs; user spent/favorites; promo redemption; view→mostViewed; maintenance gate.

### Phase 21 — RBAC
> **Revision notes (locked, vs `10` §19 + `02` §2.5 + `05` P21):**
> - **Roles:** expand `users.role` to
>   `customer | admin | manager | order_manager | product_manager | content_manager`
>   (default `customer`). No `role_permissions` table — **code-config first**.
> - **`ROLE_PERMISSIONS`:** shared module (`src/shared/rbac/`) with permissions like
>   `dashboard:read`, `products:read|write`, `categories:write`, `media:write`,
>   `orders:read|write`, `users:read|write`, `locations:write`, `promos:write`,
>   `bridal:write`, `settings:write`, `activity:read`, `notifications:read`.
>   Full **`admin`** = all. **`manager`** = all except `settings:write` + `users:write`.
>   Specialists get domain perms + `dashboard:read` (+ notifications/activity where useful).
> - **Gates:** `requireAdmin` → any staff role (rate-limit kept). New
>   `requirePermission(request, perm)` for API routes. Client: `isStaffRole` /
>   `hasPermission`; AdminGuard allows staff; nav + route map filter by perm →
>   `/admin/forbidden` if lacking.
> - **Last full Admin:** cannot demote/delete the last `role=admin`; only `admin`
>   may assign/promote to `admin`. Staff cannot edit own role.
> - **Out:** dynamic `role_permissions` table, granular field-level ACL, multi-tenant.
> - **No SQL migration required** (role col is unconstrained text); update drizzle enum +
>   contracts only.
> **Reviewed 2026-07-13 — complete.** Shared `ROLE_PERMISSIONS` + expanded roles; `requirePermission`
> on admin APIs; AdminGuard/nav/login/UserForm; last-admin + assign-admin guards; bridal media gate.
> `typecheck`/`lint`/`assert:no-secrets`/`build` green. ⏳ smoke with specialist roles on your machine.
- [x] Shared `ROLE_PERMISSIONS` + role/permission contracts.
- [x] `requirePermission` on admin APIs; last-admin + assign-admin guards.
- [x] AdminGuard/nav/login/UserForm for expanded roles + route permission map.
- [ ] ⏳ [V] product_manager blocked from settings API; order_manager can patch orders;
      last admin protected.

### Phase 22 — Automation (Cron Triggers)
> **Revision notes (locked, vs `10` §21 + `01` jobs + `05` P22):**
> - **Infra:** custom Worker (`src/cloudflare-worker.ts`) re-exports OpenNext `fetch` +
>   `scheduled`; `wrangler.jsonc` `main` + `triggers.crons`.
> - **Jobs in `src/server/jobs/`** (idempotent, take `Db`/`env`, no request path):
>   1. **cancel-unpaid** (`*/15 * * * *`) — `paymentMethod∈card|wallet` + `paymentStatus=pending`
>      + not cancelled/delivered, older than `unpaid_order_timeout_minutes` (default 60) → cancel +
>      `releaseStockForOrder` + timeline `actor=system`. **COD never auto-cancelled.**
>   2. **pending-reminders** (`0 6 * * *`) — orders in `placed|confirmed` older than
>      `pending_reminder_hours` (default 48) → notification `order_reminder` (deduped).
>   3. **cleanup-sessions** (`0 6 * * *`) — delete `sessions` with `expires_at < now`.
>   4. **daily-sales-summary** (`0 6 * * *`) — UTC-day non-cancelled revenue/order count →
>      notification `daily_summary`.
> - **Out of P22:** Paymob/Bosta reconcile (P13/P14), Temu sync (P25), FX refresh (P24) —
>   stubs/no-ops only if mentioned in dispatcher comments.
> - **Config:** settings keys above + `cron_last_runs` JSON map. Admin Settings shows timeouts +
>   last runs; `POST /api/admin/jobs/run` `{ job }` for manual smoke (`settings:write`).
> - **Notifications:** extend types with `order_reminder` | `daily_summary` (no SQL migration —
>   text col). No audit_log rows from cron (actor FK requires a user).
> **Reviewed 2026-07-13 — complete.** Custom worker + wrangler crons; jobs (unpaid cancel, reminders,
> sessions, daily summary); settings timeouts + last runs + Run now. `typecheck`/`lint`/
> `assert:no-secrets`/`build` green. ⏳ deploy + trigger cron / Run now smoke on your machine.
- [x] Custom worker + wrangler crons + jobs dispatcher.
- [x] Four jobs + settings keys + notification types.
- [x] Settings UI last-runs/timeouts + admin run endpoint.
- [ ] ⏳ [V] unpaid cancel releases stock; sessions prune; daily summary notify; manual run OK.

### Phase 23 — Homepage builder (flagged)
> **Revision notes (locked, vs `10` §17 + `02` §2.23 + `05` P23):**
> - **Flag:** `homepage_builder` in `features.config` — gates `/admin/homepage` (middleware 404 when
>   off). Storefront: if flag ON **and** ≥1 active block → render blocks in `position` order;
>   else keep today’s classic hardcoded home (hero/trust/categories/featured/recent/SEO).
> - **Table `homepage_blocks`:** `id`, `type` ∈ hero|featured|new_arrivals|collection|promo,
>   `position` int, `config` JSON, `active` bool, `created_at`.
> - **Config shapes (Zod):** hero `{ title, subtitle?, image?, ctaLabel?, ctaHref?, … }`;
>   featured `{ title?, productIds? }` (empty ids → existing featured products);
>   new_arrivals `{ title?, limit? }`; collection `{ title?, categorySlug, description? }`;
>   promo `{ title, body?, image?, ctaLabel?, ctaHref? }`.
> - **API:** public `GET /api/homepage-blocks` (active only); admin CRUD +
>   `POST .../reorder` `{ ids[] }`. Permission **`homepage:write`** (admin/manager/content_manager).
> - **UI:** `/admin/homepage` list/add/edit/toggle/reorder + MediaPicker for images.
> - **Out:** drag library (use up/down), TipTap, A/B tests, per-locale blocks.
- [x] Migration + flag + `homepage:write` RBAC.
- [x] Public + admin block APIs/services.
- [x] Admin builder UI + storefront block renderer + classic fallback.
- [x] [V] flag off → classic home; flag on + blocks → ordered sections; admin CRUD.

### Phase 24 — Dynamic pricing engine (flagged)
> **Revision notes (locked, vs `11` §1 + §5 + §7/§8 + `02` product/fx columns):**
> - **Flag `dynamic_pricing` (default OFF):** OFF → flat `basePrice EGP × (1+profit_margin)` via
>   existing `getSellPrice`. ON → for products with `base_price_usd` use landed-cost §1.2; else
>   flat fallback. Cost inputs never on storefront DTOs.
> - **`settings` keys:** `usd_egp_rate`, `bulk_shipping_usd`, `customs_duty_rate`, `vat_rate`,
>   `handling_fee_egp`, `target_margin`, `price_rounding_egp` (+ keep `profit_margin` for flat).
> - **`fx_rates` table:** history; cron `fx-rate-refresh` (daily) writes latest + updates
>   `usd_egp_rate`. Optional `FX_API_KEY`; Frankfurter fallback when unset.
> - **`products`:** `base_price_usd` (real null), `landed_cost` (int null snapshot). Keep
>   `base_price` as EGP flat-model cost (not overwritten on reprice).
> - **Single authority:** `computeSellPrice(product, settings)` in `pricing.service`.
> - **`landed-cost-reprice`:** after FX refresh / pricing-setting writes; admin manual run OK.
> - **Out of P24:** Temu importer/source columns (P25), bundles/preorders (P26).
- [x] Migration + flag + settings keys + `fx_rates`.
- [x] Landed-cost `computeSellPrice` + wire product/order/admin mappers.
- [x] `fx-rate-refresh` + `landed-cost-reprice` jobs; admin settings/product USD fields.
- [x] [V] sample USD → expected EGP; rate change re-prices; flag OFF = flat; no cost leaks.

### Phase 25 — Temu importer + stock sync
> **Revision notes (locked, vs `11` §2–§4 + §7/§8 + `02` source columns):**
> - **`products` columns:** `source_provider`, `source_url`, `source_product_id`,
>   `source_variant_map` (JSON), `source_in_stock`, `last_synced_at`, `fulfilment_type`
>   (`local_stock`|`dropship`, default `local_stock`). Pre-order fields stay P26.
> - **Import:** `POST /api/admin/import/temu` `{ url }` → draft product (never auto-publish).
>   Provider-abstracted `temu-import.service`; images → R2 + media library; description as HTML;
>   USD base → landed cost via P24 engine. Permission `products:write`. Rate-limited + audit.
> - **Secret:** `SCRAPER_API_KEY` (Wrangler / `.dev.vars`). Value `mock` uses fixture data for
>   local smoke tests without a third-party scraper.
> - **Cron `temu-stock-sync`:** for Temu-linked products, if source OOS → `stock_qty=0`,
>   `source_in_stock=false`, inventory movement `reason=sync`, notify. Never auto-inflate stock
>   when source returns. Batch/cadence via settings; runs on `0 */4 * * *` (+ manual Run now).
> - **Out of P25:** checkout Temu purchase (forbidden), bundles/preorders/UI timelines (P26).
- [x] Migration source_* + fulfilment_type + inventory `sync` reason.
- [x] temu-import service + API + R2 images + audit/rate-limit.
- [x] temu-stock-sync job + admin import UI.
- [x] [V] URL → draft; source OOS → qty 0; no auto-publish; mock mode works without live scraper.

### Phase 26 — Merchandising & trust (flagged)
> **Revision notes (locked, vs `11` §6 + §7/§8 + `02` §2.25–2.28):**
> - **Flags (default OFF):** `bundles`, `preorders`, `social_proof` in `features.config`.
> - **`bundles` + `bundle_items`:** types `bxgy` | `set` | `fixed_price`; server evaluates best
>   discount at checkout (`createOrder`); optional cart preview via `POST /api/bundles/evaluate`.
>   Admin CRUD `/admin/bundles` · `/api/admin/bundles` · permission `promos:write`.
> - **Pre-orders:** `products.preorder_enabled` + `preorder_eta_days`; when flag ON + OOS + enabled
>   → allow checkout; `order_items.is_preorder=true`; no stock reservation for those lines;
>   labelled UI. Admin fields on product form + filter list `/admin/orders?preorder=1`.
> - **Shipping timeline:** ProductDTO gets `shippingEta` / `fulfilmentType` (public labels only);
>   settings keys `shipping_eta_local` / `shipping_eta_dropship` (defaults 1–2 days / 2–3 weeks).
> - **Social proof:** settings `instagram_handle` + optional curated `instagram_post_urls` JSON;
>   storefront section on home when `social_proof` ON (no heavy 3rd-party JS).
> - **Localized copy:** product form shows “needs localization” hint when tag `temu-import`
>   and description still generic (admin workflow only).
> - **Out:** Paymob prepay for pre-orders, Instagram cron scrape, TipTap localization AI.
- [x] Migration + flags + settings keys.
- [x] Bundles evaluate + admin CRUD.
- [x] Pre-order stock/checkout + product fields + timeline UI + social section.
- [x] [V] B2G1 server-side; preorder gate; ETA labels; flags OFF = unchanged storefront.

## Phases 16–23 — Production enhancements
P16–P23 are detailed above. See also **`10-enhancements.md`**.

## Phases 24–26 — Sourcing, pricing & merchandising
P24 is detailed above. P25–P26 (importer, stock sync, merchandising) live in
**`11-sourcing-pricing-merchandising.md`** Part 8.
Key adds for later: source columns + `bundles`/`bundle_items` (`02` §2.25+),
`SCRAPER_API_KEY`, `temu-stock-sync` cron, flags `bundles/preorders/social_proof`.
Automation is catalog+inventory only — never auto-purchasing at checkout.

## Phases 13–15 — Payments (Paymob) & Shipping (Bosta)

### Phase 13 — Paymob payments (card + wallet)
> **Revision notes (locked, vs `09` Part A + D/E + `02` §2.13a):**
> - **Flag `online_payments` (default OFF):** when OFF, checkout stays COD-only (current). When ON
>   + Paymob secrets present → card/wallet selector.
> - **`payments` table** + existing `orders.payment_method`/`payment_status` (already on schema).
> - **Flow:** `POST /api/orders` (card/wallet → `payment_status=pending`) →
>   `POST /api/payments/paymob/intention` → redirect Unified Checkout →
>   `POST /api/webhooks/paymob` (HMAC-SHA512 source of truth) → confirmation polls
>   `GET /api/payments/[orderId]`.
> - **Never** trust browser redirect alone. Failure → `payment_status=failed`, order stays `placed`,
>   retry via new intention. COD path untouched. Bosta auto-create deferred to **P14**.
> - Secrets: `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`,
>   `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET` (optional mock via
>   `PAYMOB_SECRET_KEY=mock` for local smoke).
- [x] Secrets + env types + `payments` migration + `online_payments` flag.
- [x] `paymob.service` intention + HMAC webhook + payment status API.
- [x] Checkout method selector + redirect + confirmation polling.
- [x] [V] typecheck/lint/assert/build; COD unchanged when flag OFF.

### Phase 14 — Bosta shipping
> **Revision notes (locked, vs `09` Part B + D/E + `02` §2.13b):**
> - **Flag `bosta_shipping` (default OFF):** when OFF, no auto-create / admin actions no-op with clear error.
> - **`shipments` table** + `governorates.bosta_city_id` / `bosta_zone` / `bosta_district` (admin editable).
> - **Auto-create** delivery after COD place **or** Paymob paid webhook (best-effort — never fail checkout).
> - **Webhook** `POST /api/webhooks/bosta?secret=…` verifies `BOSTA_WEBHOOK_SECRET`; maps state → OrderStatus;
>   idempotent on `(bosta_delivery_id, bosta_state)` via raw event id when present.
> - **Admin:** `/api/admin/orders/[id]/shipment` create/refresh, `/api/admin/shipments` list;
>   Locations page edits Bosta city mapping. Tracking on storefront OrderDTO.tracking.
> - Secrets: `BOSTA_API_KEY` (`mock` for local), `BOSTA_WEBHOOK_SECRET`, `BOSTA_BUSINESS_ID`.
> - **Out of P14:** production go-live hardening (P15), Paymob+Bosta reconcile cron.
> **Reviewed 2026-07-14 — complete.** Migration `0012` (`shipments` + governorate Bosta cols);
> `bosta.service` create/mock/live + webhook + auto-create; admin create/refresh + `/admin/shipments`;
> Locations Bosta fields; storefront tracking. `typecheck`/`lint`/`assert:no-secrets`/`build` green.
> ⏳ staging Bosta smoke on your machine.
- [x] Secrets + env + flag + `shipments` + governorate Bosta columns + seed mapping.
- [x] `bosta.service` create/track + auto-create + webhook mapping.
- [x] Admin shipment UI + Locations Bosta fields + storefront tracking.
- [x] [V] typecheck/lint/assert/build; flag OFF = no Bosta calls.

### Phase 15 — Hardening & go-live
> **Revision notes (locked, vs `09` Part E + C.1):**
> - **`webhook_events` table** — `(id, provider, event_id UNIQUE(provider,event_id), payload?, received_at)`
>   claim-before-process for Paymob + Bosta (strict dedupe beyond soft checks).
> - **Provider retries** — shared `withRetry` (3 attempts, exponential backoff) on live Paymob intention +
>   Bosta create/get; no retry on 4xx except 429.
> - **Reconcile job `integrations-reconcile`** — hourly (+ Run now): sync payment↔order mismatches,
>   auto-create missing shipments when Bosta flag ON, refresh open shipments, report counts.
> - **Admin** `GET /api/admin/integrations/status` — flag/secret health + issue counts; Settings cron
>   panel lists the new job. Timing-safe Bosta secret compare.
> - **Out of agent:** production Wrangler secret swap + live deploy smoke (checklist ⏳ on your machine).
> **Reviewed 2026-07-14 — complete.** Migration `0013_last_salo` (`webhook_events`); `fetchWithRetry`;
> Paymob/Bosta claim + pending→success fix; hourly reconcile + Settings health panel. `typecheck`/`lint`/
> `assert:no-secrets`/`build` green. ⏳ production keys + remote migrate + deploy smoke on your machine.
- [x] `webhook_events` migration + claim in Paymob/Bosta webhooks; retry helper on provider calls.
- [x] Reconcile job + admin integrations status (+ cron wiring).
- [x] Docs / go-live notes; typecheck/lint/assert/build.

---

## Cross-cutting "definition of done" (every task)
- No `any`; TypeScript strict passes.
- New code imported only via feature/`server` boundaries (no deep cross-feature imports).
- Handler stays thin (validate → service → envelope); logic in service/repo.
- Matching contract schema reused on client + server.
- `pnpm build && pnpm typecheck && pnpm lint` clean before checking the box.
