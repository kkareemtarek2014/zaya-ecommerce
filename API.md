# Zaya API

Live **storefront** HTTP contract for the Cloudflare Worker (`zaya-ecommerce`).
Admin APIs are planned — see [`docs/backend/08-admin-dashboard.md`](docs/backend/08-admin-dashboard.md).
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

**Secrets never serialized:** `basePrice` and `password_hash` / `passwordHash` stay server-only (`toProductDTO` / `toUserDTO`). Run `pnpm assert:no-secrets`.

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

`ProductDTO` includes sell `price` only — never `basePrice`.

---

## Promo & orders

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/promos/validate` | — |
| POST | `/api/orders` | guest OK (attaches `user_id` if session) |
| GET | `/api/orders` | required |
| GET | `/api/orders/[id]` | public by unguessable id |

Order totals are **server-computed** (prices, shipping zones, free ≥1500 on pre-discount subtotal, promo).

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
# set secrets (once): SESSION_SECRET, PASSWORD_PEPPER
pnpm db:seed:remote   # export local seeded data → remote D1 (no wipe)
pnpm run deploy       # note: use `pnpm run deploy` (not bare `pnpm deploy`)
pnpm assert:no-secrets
```

Seeded logins (change before public go-live): `test@example.com` / `password123`, `admin@zaya-eg.com` / `password123`.
