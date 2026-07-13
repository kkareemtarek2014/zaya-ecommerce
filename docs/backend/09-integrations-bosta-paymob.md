# 09 — Integrations: Paymob (payments) & Bosta (shipping)

Adds **online payments via Paymob** (card + mobile wallet, alongside existing COD) and **fulfilment via
Bosta** (delivery creation, COD collection, live tracking) to the Cloudflare backend. Both are Egyptian
providers. Everything is server-side on Workers; secrets live in Wrangler; the storefront checkout UI
gains payment-method options but keeps its look and flow.

> Build order: this layers on the storefront backend (`00`–`07`) and reuses the admin dashboard (`08`)
> for shipment creation + payment/fulfilment visibility. See §7 for phases.
>
> ⚠️ **Verify live details** before coding: Paymob → https://developers.paymob.com (Intention APIs,
> Checkout Experiences, Webhook/HMAC). Bosta → https://docs.bosta.co/api (Deliveries, Cities/Zones,
> Webhooks). Exact field names, state codes, and base URLs can change; the flows below are stable but
> confirm request bodies against the current reference.

---

## PART A — Paymob (payments)

### A.1 Model & principle
- Payment methods on checkout: `cod` (unchanged, no gateway), `card`, `wallet` (Paymob mobile wallet).
- **Callbacks (webhooks) are the source of truth** for payment status — never mark an order paid from
  the browser redirect alone. Redirect is UX only; the HMAC-verified webhook confirms it.
- Amounts are sent in **piasters** (EGP × 100). Our order totals are integer EGP → multiply by 100.

### A.2 Credentials (Wrangler secrets)
| Secret | Use |
| --- | --- |
| `PAYMOB_SECRET_KEY` | server API auth for Intention API (Bearer) |
| `PAYMOB_PUBLIC_KEY` | used to launch the hosted/embedded checkout |
| `PAYMOB_HMAC_SECRET` | verify webhook callbacks (HMAC SHA-512) |
| `PAYMOB_INTEGRATION_ID_CARD` | card integration id (from dashboard) |
| `PAYMOB_INTEGRATION_ID_WALLET` | mobile-wallet integration id |

Set via `wrangler secret put PAYMOB_SECRET_KEY` … Store non-secret ids in `settings`/env if preferred.
Use **test** keys until go-live, then swap for production keys.

### A.3 Flow (Intention API + Unified Checkout)
```
Checkout (card/wallet chosen)
  1. POST /api/orders            → create order in D1 with payment_status='pending' (COD path skips 2–5)
  2. server: Paymob Intention API (PAYMOB_SECRET_KEY)
        body: { amount(piasters), currency:'EGP', payment_methods:[integrationId(s)],
                items[], billing_data{name,phone,email,...}, extras/special_reference: order.id }
        → returns { client_secret, id }
  3. server stores payments row (paymob_intention_id, client_secret) linked to order
  4. client redirects to Unified Checkout using PAYMOB_PUBLIC_KEY + client_secret
        (Redirect option = simplest; Pixel embedded = more control)
  5. customer pays (3-D Secure if required) → Paymob redirects back to /order/[id]?... (UX only)
  6. Paymob → POST /api/webhooks/paymob  (source of truth)
        verify HMAC SHA-512 over the ordered concatenation of transaction fields
        on success: payment_status='paid', order.status='confirmed' → trigger Bosta (Part B)
        on failure: payment_status='failed' (order stays 'placed', allow retry)
```

### A.4 Endpoints (this app)
- `POST /api/payments/paymob/intention` *(internal, called by order flow or a thin client step)* —
  `{ orderId }` → `{ clientSecret, publicKey, checkoutUrl }`. Reuses the order's server-computed total.
- `POST /api/webhooks/paymob` *(public, no auth; HMAC-verified)* — Paymob callback. Idempotent
  (dedupe on transaction id). Updates `payments` + `orders`, then kicks off Bosta shipment on success.
- `GET /api/payments/[orderId]` *(auth or owner)* — payment status for the confirmation page polling.

### A.5 HMAC verification (do not skip)
Compute HMAC-SHA512 with `PAYMOB_HMAC_SECRET` over the specific ordered fields Paymob documents for the
callback (e.g. `amount_cents, created_at, currency, error_occured, has_parent_transaction, id,
integration_id, is_..., order.id, owner, pending, source_data.*, success`). Compare to the `hmac` query/
body value in constant time. Reject on mismatch (`FORBIDDEN`). This is the single most important security
step — an unverified webhook must never change payment status.

### A.6 Data (see `02` additions)
`payments` table + `orders.payment_status`, `orders.payment_method` extended to `cod|card|wallet`.

---

## PART B — Bosta (shipping / fulfilment)

### B.1 Model & principle
- When an order is ready to ship (COD confirmed at checkout, or Paymob payment succeeded), the backend
  creates a **Bosta delivery** and stores its tracking number. Bosta handles pickup, delivery, and (for
  COD) cash collection, and pushes **status updates via webhook**.
- Bosta status → our `OrderStatus` via a mapping table (§B.5). Bosta's tracking number surfaces on the
  order confirmation + account order pages and in the admin.

### B.2 Credentials (Wrangler secrets)
| Secret | Use |
| --- | --- |
| `BOSTA_API_KEY` | `Authorization` header for all Bosta API calls |
| `BOSTA_WEBHOOK_SECRET` | verify incoming Bosta webhooks (if provided) / shared token in URL |
| `BOSTA_BUSINESS_ID` | pickup/business context (from dashboard) |

Base URL (verify): `https://app.bosta.co/api/v2`. Use Bosta's **staging** credentials first.

### B.3 Flow
```
Order ready to ship (COD placed, or payment webhook success)
  1. map order.governorate → Bosta city/zone (see B.4)
  2. POST {BOSTA}/deliveries
        { type: SEND (package delivery),
          specs: { packageType, size, packageDetails{ description, itemsCount } },
          cod: (order.total if COD else 0),
          dropOffAddress: { city, zone, district, firstLine, buildingNumber, floor, apartment },
          receiver: { firstName, lastName, phone, email },
          notes, businessReference: order.id }
        → { _id, trackingNumber, state }
  3. store shipments row (bosta_delivery_id, tracking_number, state) linked to order
  4. Bosta → POST /api/webhooks/bosta on each state change → update shipment + order.status
  5. GET {BOSTA}/deliveries/:id  (or track by trackingNumber) for on-demand refresh / admin
```

### B.4 Location mapping (important)
Our 27 `governorates` must map to Bosta **cities/zones/districts**. Add a `bosta_city_id` (and
optionally zone/district) to `governorates`, or a `governorate_bosta_map` reference seeded once by
calling Bosta `GET /cities` (+ zones/districts). Admin Locations page (`08`) manages this mapping.
Checkout still uses our governorate select; the server resolves the Bosta ids at delivery-creation time.

### B.5 Status mapping (Bosta → OrderStatus)
Bosta exposes delivery **state** codes/labels (e.g. created / picked up / in transit / out for delivery /
delivered / returned / canceled). Map to our enum:
| Bosta state (verify exact codes) | Our `OrderStatus` |
| --- | --- |
| Created / Pickup requested | `confirmed` / `sourced` |
| Picked up / In transit | `shipped` |
| Out for delivery | `out_for_delivery` |
| Delivered | `delivered` |
| Returned / Canceled | `cancelled` |
Keep the raw Bosta state on the `shipments` row for audit; drive UI from the mapped `OrderStatus`.

### B.6 Endpoints (this app)
- `POST /api/webhooks/bosta` *(public; verify shared secret/signature)* — status updates; idempotent.
- Admin (`requireAdmin`, under `/api/admin`):
  - `POST /api/admin/orders/[id]/shipment` — create Bosta delivery for an order (manual trigger/retry).
  - `GET /api/admin/orders/[id]/shipment` — fetch live tracking.
  - `GET /api/admin/shipments` — list/filter shipments.
- Storefront: order/confirmation + account order pages show `trackingNumber` + a Bosta tracking link
  (read from the `shipments` row via the existing order DTO — see `03`).

---

## PART C — Cross-cutting

### C.1 Data-model additions (full detail in `02`)
- `orders.payment_method` → `cod | card | wallet`; add `orders.payment_status` (`pending|paid|failed|
  refunded`) and `orders.fulfilment_status` (or reuse `status` driven by Bosta).
- **`payments`** — `id, order_id FK, provider('paymob'), method, amount, currency, paymob_intention_id,
  paymob_transaction_id, status, raw(json), created_at`.
- **`shipments`** — `id, order_id FK, provider('bosta'), bosta_delivery_id, tracking_number,
  bosta_state(raw), mapped_status, cod_amount, raw(json), created_at, updated_at`.
- `governorates.bosta_city_id` (+ zone/district) for location mapping.
- Webhook idempotency: unique on `paymob_transaction_id` / Bosta event id (or a `webhook_events` table).

### C.2 Architecture / config
- Add secrets (A.2, B.2) to `wrangler.toml` bindings/secrets and `env.d.ts` (`CloudflareEnv`).
- New server modules: `server/services/paymob.service.ts`, `server/services/bosta.service.ts`,
  `server/repositories/payments.repo.ts`, `shipments.repo.ts`; webhook handlers under
  `app/api/webhooks/{paymob,bosta}/route.ts` (thin: verify → service → envelope). Keep provider SDK-less
  (plain `fetch` to their REST APIs) to stay Workers-compatible.
- Webhook routes are **excluded from auth**, but each **must verify** provider signature/secret.
- Rate-limit and log all webhook calls (`audit_log` / a `webhook_events` table).

### C.3 Checkout UX (storefront — minimal, on-brand change)
- `CheckoutForm` gains a payment-method selector (`cod` default; `card`, `wallet`). COD path is unchanged
  (place order → confirmation). Card/wallet path: place order (`pending`) → redirect to Paymob → return
  to `/order/[id]` which **polls `GET /api/payments/[orderId]`** until the webhook confirms, then shows
  paid state. Uses existing `Button`/`Select`/`Loader`; no new design language.
- Keep prices/totals server-authoritative; the gateway amount is derived from the D1 order, never the
  client.

### C.4 Admin (extends `08`)
- Orders detail: show payment status (Paymob) + a "Create/Refresh Bosta shipment" action + tracking
  number/link. Shipments list with filters. Payments visible per order. Manual retry for failed
  shipment creation. All gated by `requireAdmin` + audit-logged.

---

## Part D — Phases (continue `05-plan.md`; after admin P8–P12)

- **P13 — Payments (Paymob):** secrets; `payments` table + order fields; `paymob.service`; intention
  endpoint; Unified Checkout redirect; `POST /api/webhooks/paymob` with HMAC; checkout method selector;
  confirmation polling. **Verify (test keys):** card + wallet test payment → webhook flips order to
  paid/confirmed; tampered/invalid HMAC rejected; failed payment allows retry; COD unaffected.
- **P14 — Shipping (Bosta):** secrets; `shipments` table + governorate→Bosta mapping (seed from
  `GET /cities`); `bosta.service`; auto-create delivery on COD-place / payment-success; admin
  create/refresh shipment; `POST /api/webhooks/bosta` status mapping; tracking on order pages.
  **Verify (staging):** delivery created with correct COD + address; webhook updates order status via
  the mapping; tracking number shows on confirmation/account/admin; cancel/return maps to `cancelled`.
- **P15 — Hardening & go-live:** idempotent webhooks (dedupe), retries/backoff for provider calls,
  reconciliation (payment vs order vs shipment), switch to production keys, security review of webhook
  signature verification, deploy. **Verify:** `07` integration checklist green in production.

## Part E — Task checklist
**Paymob (P13)**
- [x] Set `PAYMOB_*` secrets; add to `env.d.ts`/wrangler.
- [x] `payments` table + `orders.payment_status`, extend `payment_method`.
- [x] `paymob.service` (intention create, amount→piasters, billing_data from order).
- [x] `POST /api/payments/paymob/intention`; `GET /api/payments/[orderId]`.
- [x] `POST /api/webhooks/paymob` with **HMAC-SHA512** verify + idempotency.
- [x] Checkout method selector + redirect + confirmation polling (COD path untouched).
- [x] [V] test card/wallet → paid via webhook; bad HMAC 403; failure ret/retry; amounts match order.

**Bosta (P14)**
- [x] Set `BOSTA_*` secrets; add to `env.d.ts`/wrangler.
- [x] `shipments` table; `governorates.bosta_city_id` (+zone) mapping; seed from Bosta cities.
- [x] `bosta.service` (create delivery, get/track); auto-create on COD-place / payment-success.
- [x] Admin: create/refresh shipment endpoints + UI; shipments list.
- [x] `POST /api/webhooks/bosta` with signature/secret verify + Bosta→OrderStatus mapping + idempotency.
- [x] Surface tracking number/link on confirmation + account order + admin.
- [x] [V] typecheck/lint/assert/build; flag OFF = no Bosta calls. ⏳ staging smoke on your machine.

**Go-live (P15)**
- [x] Webhook dedupe (`webhook_events` or unique constraints); provider-call retries/backoff.
- [x] Reconciliation job/report (order ↔ payment ↔ shipment consistency).
- [x] Timing-safe webhook secret compare + go-live notes in `.dev.vars.example` / docs.
- [ ] ⏳ [V] Swap to production keys; remote migrate `0013`; deploy smoke — on your machine.

## Part F — Definition of done
Customers can pay COD, card, or mobile wallet (Paymob); paid orders auto-create a Bosta delivery with
COD collection and live tracking; order status reflects Bosta state via webhooks; admin can view payment
status, create/refresh shipments, and see tracking; all amounts are server-authoritative; both webhooks
are signature-verified and idempotent; secrets are in Wrangler; deployed on account
`kkareemtarek2@gmail.com`.

## Sources (provider docs — verify current details before implementing)
- Paymob APIs / Intention flow: [developers.paymob.com — APIs](https://developers.paymob.com/paymob-docs/integration-paths/apis)
- Paymob webhook/HMAC: [developers.paymob.com — Webhook & HMAC](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/overview)
- Bosta API reference: [docs.bosta.co/api](https://docs.bosta.co/api) · [Custom API](https://bosta.co/en-eg/merged-integrations/custom-api)
