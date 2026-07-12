# 05 — Implementation Plan (Phased)

Work is broken into small, verifiable phases. Each phase is independently shippable and ends with a
green `pnpm build && pnpm typecheck && pnpm lint`. Do **not** implement more than one phase at a time;
finish, verify, then continue (matches the original prompt's "work incrementally" rule).

Ordering rationale: infrastructure first (so everything has a DB), then **reads** (lowest risk, most
pages), then **writes/auth** (highest risk), then account, then hardening + deploy.

---

## Phase 0 — Cloudflare & tooling setup
Stand up the runtime and resources; app still runs on static data.
- Add deps: `@opennextjs/cloudflare`, `wrangler`, `drizzle-orm`, `drizzle-kit`, `@cloudflare/workers-types`.
- Create resources in account `kkareemtarek2@gmail.com`:
  - `wrangler d1 create zaya-db`
  - `wrangler r2 bucket create zaya-uploads`
  - `wrangler secret put SESSION_SECRET` · `wrangler secret put PASSWORD_PEPPER`
- Add config: `wrangler.toml` (bindings `DB`, `UPLOADS`), `open-next.config.ts`, `drizzle.config.ts`,
  `env.d.ts` (`CloudflareEnv`). Add scripts: `preview`, `deploy`, `db:generate`, `db:migrate:local`,
  `db:migrate:remote`, `db:seed`.
- **Verify:** `pnpm build`; `wrangler dev`/`opennextjs-cloudflare preview` boots; a throwaway
  `GET /api/health` returns `{ ok:true }`.

## Phase 1 — Database layer
- Write all Drizzle schemas (`server/db/schema/*`) + barrel.
- `drizzle-kit generate` → migrations; apply local.
- Write `seed.ts` porting `shared/data` (+ re-hash seed user, seed reviews & wallet). Run against local D1.
- Build `getDb()` client and the `http/envelope.ts`, `http/errors.ts`, `http/handler.ts` helpers.
- Add `shared/contracts/*` (envelope, product, order, auth, promo, review, account).
- **Verify:** `wrangler d1 execute zaya-db --local --command "SELECT count(*) FROM products"` = 12,
  categories = 7, governorates = 27, promos = 2, users = 1.

## Phase 2 — Catalog read APIs + wire product service
- Repositories: `products.repo`, `categories.repo`, `governorates.repo`.
- `server/services/product.service.ts` maps rows → `ProductDTO` (**strips `basePrice`**, adds `price`).
- Routes: `/api/products`, `/api/products/[id]`, `/api/products/[id]/related`, `/api/products/new`,
  `/api/products/search`, `/api/categories`, `/api/governorates`.
- Rewrite `products.service.ts` bodies to `api` calls; swap `basePrice`→`price` in components/cart.
- RSC pages call server product service directly; keep SEO/JSON-LD/`generateStaticParams`.
- **Verify:** home, `/shop`, `/shop/[category]`, `/product/[id]`, search modal render identically from
  the API; no `basePrice` in any network response; sort/filter/search behavior matches.

## Phase 3 — Auth (sessions)
- `auth/password.ts` (PBKDF2), `auth/session.ts` (create/verify/destroy + cookie), `require-auth.ts`.
- `users.repo`, `sessions.repo`, `server/services/auth.service.ts`.
- Routes: `register`, `login`, `logout`, `me`, `forgot-password`.
- Rewrite `authService.*`, add `useLogin/useRegister/useForgotPassword/useLogout/useSession`; delete
  `users.store`; hydrate `auth.store` from `/api/auth/me`.
- **Verify:** register→auto-login→cookie set; login with seed user; bad creds → 401; protected route
  redirects when logged out; refresh keeps session; logout clears it.

## Phase 4 — Promo + Orders
- `promo.service` + `POST /api/promos/validate`; cart `applyCoupon` calls it.
- `order.service` (recompute prices/shipping/discount/total), `orders.repo`, `order_items`.
- Routes: `POST /api/orders`, `GET /api/orders/[id]`, `GET /api/orders` (auth).
- `usePlaceOrder`; `CheckoutForm.onSubmit` → mutation; remove `ordersStore.placeOrder` + mock.
- **Verify:** place a COD order → 201 with server-computed totals (tampered client prices ignored);
  `/order/[id]` shows it; free-shipping ≥1500 and zone rates correct; promo discount applied; account
  orders list shows the order for a logged-in user.

## Phase 5 — Account (profile, addresses, favorites, wallet)
- Repos + routes for profile, addresses (list/create/delete), favorites (get/put), wallet (flag-gated).
- Hooks: `useProfile/useUpdateProfile`, `useAddresses/useAddAddress/useRemoveAddress`,
  `useFavoritesSync`, `useWallet`. Rewire the account components + favorites login-sync.
- **Verify:** profile update persists; add/remove address; favorites sync on login; wallet balance =
  Σcredit−Σdebit and route 404s when flag off.

## Phase 6 — Bridal requests + R2 + Reviews
- `upload.service` (R2 put/get), `bridal-requests.repo`, `POST /api/bridal-requests` (multipart, ≤25MB).
- `useSubmitBridalRequest` (multipart); real file now uploads.
- `reviews.repo` + `GET /api/reviews`; rewire `ProductReviews` to live data + summary/breakdown.
  (`POST /api/reviews` added but no UI yet.)
- **Verify:** bridal submit stores a row + R2 object; oversized/wrong-type file rejected (413/400);
  product reviews render from DB with correct average and bars.

## Phase 7 — Hardening & deploy
- Consistent error envelope everywhere; input validation on every write; basic rate-limit on auth +
  bridal (KV optional); security headers; ensure `basePrice`/`password_hash` never serialized.
- Apply migrations + seed to **remote** D1; set secrets; `deploy`.
- Smoke test production; keep cart/checkout/order noindex; update `SITE.url` if a domain exists.
- Write `API.md` at repo root (the CLAUDE.md TODO) documenting the live contract.
- **Verify:** full checklist in `07-checklist.md` passes against the deployed Worker.

---

## Admin dashboard phases (P8–P12)

The storefront migration (P0–P7) ships first. The admin dashboard is layered on the same backend.
**Full detail — modules, folder structure, API, tasks — is in `08-admin-dashboard.md`.** Summary:

- **P8 — Admin auth & shell:** `users.role`, `requireAdmin`, `AdminGuard`, `AdminShell`
  (sidebar/topbar/breadcrumbs), admin login, seed an admin user, new reusable UI primitives
  (`DataTable`, `Pagination`, `Dialog`/`ConfirmDialog`, `Toast`, `Tabs`, `SearchInput`).
- **P9 — Products & Categories CRUD + R2 images:** admin product/category APIs, list
  (search/filter/paginate), create/edit/delete, image upload/replace/delete.
- **P10 — Orders & Users:** orders list/detail/status-transition; users list/view/edit/delete (with
  last-admin/self guards).
- **P11 — Locations, Promos, Bridal, Settings:** governorates + shipping-zone fees, promo CRUD, bridal
  request review, settings page (margin 0.20–0.30 clamp). Pricing/shipping read effective settings.
- **P12 — Dashboard stats + hardening:** `/api/admin/stats`, stat cards + sales chart + recent orders/
  latest products, `audit_log`, admin rate-limit, deploy.

> **Seeders (critical):** the Phase 1 seeder is extended so **every** static dataset — products,
> categories, governorates, shipping rates, promos, users (+admin), reviews, wallet, and the sample
> order — lands in D1. After `pnpm db:seed` no manual data entry is needed and the storefront +
> dashboard show the existing content. See `08` §8 and `02` §6.

## Integration phases (P13–P15)

Layer real payments + fulfilment on the backend. **Full spec — flows, HMAC, credentials, status mapping,
tasks — in `09-integrations-bosta-paymob.md`.** Summary:

- **P13 — Paymob payments:** card + mobile-wallet checkout via the Intention API + Unified Checkout;
  `payments` table + `orders.payment_status`; `POST /api/webhooks/paymob` (HMAC-SHA512, source of truth);
  COD path unchanged.
- **P14 — Bosta shipping:** auto-create a Bosta delivery on COD-place / payment-success; `shipments`
  table + governorate→Bosta mapping; `POST /api/webhooks/bosta` maps delivery state → `OrderStatus`;
  tracking number on order + admin.
- **P15 — Hardening & go-live:** idempotent/deduped webhooks, provider retries/backoff, reconciliation,
  production keys, security review, deploy.

---

## Dependency graph

```
P0 → P1 → P2 ─┐
              ├→ P4 (orders needs products + promo; guest ok)
        P1 → P3 ┘        P3 → P5 (account needs auth)
        P1 → P6 (bridal/reviews; reviews read is public)
   P2,P3,P4,P5,P6 → P7
        P3 → P8 (admin needs auth/roles) → P9 → P10 → P11 → P12
        P2 → P9 (products) · P4 → P10 (orders) · P5 → P11 (locations/settings)
        P4 → P13 (payments need orders) → P14 (shipping on payment/COD) → P15 (go-live)
        P8 → P14 (admin shipment actions)
```

## Risk notes
- **Prices**: never trust client; recompute server-side (P2 mapper, P4 order service). Highest-value bug.
- **Workers crypto**: no bcrypt; use Web Crypto PBKDF2 (P3).
- **OpenNext specifics**: bindings via `getCloudflareContext()`; test `preview` early (P0).
- **Denormalized rating**: keep `products.rating/review_count` in sync on review insert (P6).
