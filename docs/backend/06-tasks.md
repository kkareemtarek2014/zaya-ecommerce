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
- [ ] `upload.service` (R2 put/get), `bridal-requests.repo`, `POST /api/bridal-requests` (multipart, ≤25MB, image/video).
- [ ] `useSubmitBridalRequest` (multipart); wire `BridalRequestForm`.
- [ ] `reviews.repo` + `GET /api/reviews?productId=`; rewire `ProductReviews` (list + average + breakdown bars). `POST /api/reviews` (auth, no UI).
- [ ] [V] Bridal submit → DB row + R2 object; oversized/wrong-type rejected (413/400); reviews render from DB with correct summary; recompute updates product rating/count.

## Phase 7 — Hardening & deploy
- [ ] Audit: every write validated with a contract schema; every route returns the envelope; errors mapped to codes.
- [ ] Ensure `basePrice` & `password_hash` never serialized (add a serialization test/grep).
- [ ] Basic rate-limit on `auth/*` + bridal (optional KV); security headers.
- [ ] `db:migrate:remote` + seed remote D1; set secrets; `deploy`.
- [ ] Smoke test production URL; verify cart/checkout/order still `noindex`.
- [ ] Write `API.md` at repo root (CLAUDE.md TODO); update `SITE.url` if domain purchased.
- [ ] [V] Full `07-checklist.md` passes against deployed Worker.

## Phases 8–12 — Admin dashboard
The full, granular admin task list (auth & shell, products/categories CRUD + images, orders & users,
locations/promos/bridal/settings, dashboard stats) lives in **`08-admin-dashboard.md` §10**. Do those
after P0–P7 are green. Note the extra `users.role` migration in P8 and that pricing/shipping must read
**effective settings** once P11 lands.

## Phases 16–23 — Production enhancements
The full, granular enhancement task list (inventory ⭐, order timeline ⭐, bulk ⭐, duplication ⭐, audit
viewer ⭐, drafts/SEO, CSV, media library, notifications, customer 360, coupon usage, analytics, RBAC,
cron triggers, homepage builder) lives in **`10-enhancements.md`**. Key schema adds are in `02` §2b
(`inventory_movements`, `order_status_history`, `notifications`, `media_assets`, `promo_redemptions`,
`product_views`) plus product columns (`status/slug/sku/stock_qty/reserved_qty/SEO`). Storefront reads
only `published`, stock-aware products. Cron jobs go in `server/jobs/` (`01`).

## Phases 24–26 — Sourcing, pricing & merchandising
The full, granular task list (landed-cost pricing engine, Temu importer, stock sync, bundles,
pre-orders, shipping timelines, social proof) lives in **`11-sourcing-pricing-merchandising.md`** Part 8.
Key adds: product source/pricing columns + `bundles`/`bundle_items`/`fx_rates` (`02` §2.25–2.28),
`SCRAPER_API_KEY`/`FX_API_KEY` (`01`), `temu-stock-sync` + `fx-rate-refresh` cron (`server/jobs/`),
`computeSellPrice` as the single price authority, and flags `dynamic_pricing/bundles/preorders/
social_proof`. Automation is catalog+inventory only — never auto-purchasing at checkout.

## Phases 13–15 — Payments (Paymob) & Shipping (Bosta)
The full, granular integration task list lives in **`09-integrations-bosta-paymob.md` Part E**. Key
adds: `payments`/`shipments` tables (`02`), `PAYMOB_*`/`BOSTA_*` secrets (`01`), HMAC-SHA512 Paymob
webhook + Bosta status-mapping webhook (both idempotent), checkout method selector + confirmation polling,
governorate→Bosta location mapping, and admin shipment create/track. Webhooks are the source of truth —
never mark paid/shipped from the browser.

---

## Cross-cutting "definition of done" (every task)
- No `any`; TypeScript strict passes.
- New code imported only via feature/`server` boundaries (no deep cross-feature imports).
- Handler stays thin (validate → service → envelope); logic in service/repo.
- Matching contract schema reused on client + server.
- `pnpm build && pnpm typecheck && pnpm lint` clean before checking the box.
