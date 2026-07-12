# Feature Gap & Tasks: order-base → Zaya

> Features/tasks to bring into **Zaya** from **order-base**, plus UI improvements.
> This is a planning doc for future implementation. Nothing here is built yet.

## Build approach: static / dummy-data first

**No backend for now.** Build every task below as a fully static, front-end-only feature using the dummy data layer (`src/shared/data/`) and persisted Zustand stores (localStorage). The backend comes later — when it does, only the service bodies / store submit functions change (Zaya rule #4). Nothing here is blocked; there is no "wait for API" item. Where a feature would normally need a server (auth credentials, order status updates, wallet balances), mock it in the service and hardcode/seed sensible dummy values for now.

## Scope note

Dropped from this list (not needed for an accessories store): Address Picker and Product Customization (bridal-only — the existing `bridal-custom` form is enough), Custom Cake (bakery-specific), and Multi-language / i18n.

## How to read this

Each item has: what it should do, what Zaya has today, and an implementation sketch that respects Zaya's own rules (pnpm, Tailwind v4 CSS-first, Zustand + React Query, `getSellPrice`, `useHydrated`, barrel exports, dummy data layer).

---

## Summary table

| # | Task | Source | In Zaya today? | Priority | Effort |
|---|------|--------|----------------|----------|--------|
| 1 | User Authentication | order-base `user_auth` | ❌ None | High (needed for accounts/orders) | Large |
| 2 | Feature Toggle System | order-base architecture | ❌ None | High (Zaya's whole pitch is reusable) | Medium |
| 3 | Order Details + status timeline | order-base `order_details` | ⚠️ Confirmation page only | Medium | Small |
| 4 | Promo Code (cart) | order-base `promo_code` | ⚠️ Already in CartDrawer | Low (mostly done) | Small |
| 5 | Order Note (cart) | order-base `order_note` | ❌ None | Low | Small |
| 6 | My Wallet | order-base `account_wallet` | ❌ None | Low | Small |
| 7 | Product list sorting | new | ❌ None | High (quick UX win) | Small |
| 8 | Beautify product card + remove rating | new | ⚠️ Card shows rating | High (quick UX win) | Small |
| 9 | Recommended products in cart drawer | order-base `RecommendedProducts` | ❌ None | Medium | Small |
| 10 | Wishlist heart on products | order-base `account_favorites` | ⚠️ Store + page exist, no heart button | High (quick win) | Small |

---

## 1. User Authentication `user_auth`

**order-base:** Full NextAuth.js auth — email/password + Google + Facebook OAuth, session via httpOnly cookies, middleware-protected routes, `AuthGuard` component. Pages: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`. Code lives in `src/features/auth/`, context in `src/context/AuthContext.tsx`, guard in `src/middleware.ts`.

**Zaya today:** No auth at all. No `next-auth` dependency. Orders/account are client-side only (`Zaya-orders`, `Zaya-cart` in localStorage); account pages read from local Zustand stores with no real user.

**Implementation sketch for Zaya:**
- **Static for now:** build the full UI (login / register / forgot / reset) and a mock `auth.service.ts` that validates against dummy users in `src/shared/data/` and stores a fake session in a persisted store. No real server calls.
- Add `src/features/auth/` with a barrel export. Skip installing `next-auth` until the backend is real — a lightweight mock auth context is enough for a static build.
- For the Egypt market, phone/OTP may fit better than email/password — consider that over OAuth when the real backend arrives.
- When the backend exists: swap the mock service for NextAuth (httpOnly cookies, rule #5 — no tokens in localStorage) with only service/context changes.

---

## 2. Feature Toggle System (architecture, not a folder)

**order-base:** The core selling point. A central registry `src/config/features.config.ts` is the single source of truth. Every feature ships a typed `feature.config.ts` (`key`, `label`, `enabled`, `alwaysOn`, `routes[]`, `navItems[]`, `parentFeature`, `subFeatures[]`). Three enforcement points: (1) header nav filters by `isEnabled()`, (2) middleware 404s disabled routes, (3) each feature root returns `null` when its key is off. Sub-features can't be on if the parent is off.

**Zaya today:** No toggle system. Only `src/config/site.config.ts` holds business rules (margin, shipping, thresholds). Features are simply present.

**Implementation sketch for Zaya:**
- Highest-leverage port if you want Zaya to become a reusable theme like order-base.
- Add `src/config/features.config.ts` with a `FeatureKey` union for Zaya's features (`shop`, `product`, `cart`, `checkout`, `order`, `account`, `bridal-custom`, `product-search`).
- Add a `FeatureContext` + `isEnabled(key)` hook, gate `AccountNav`/header nav, and gate each feature root component.
- Add route-guard middleware (Zaya has no `middleware.ts` yet — new file).
- Start lighter than order-base: nav filtering + root-null gating first, add middleware 404s later.

---

## 3. Order Details + status timeline `order_details`

**order-base:** Full order page `/order/[id]` with a visual status timeline, itemized list, and summary (`OrderDetailsPage`, `OrderStatusTimeline`, `OrderItemList`, `OrderSummary`, `OrderInfo`, `useOrderDetails`).

**Zaya today:** `features/order/` only has `OrderConfirmation.tsx` + `orders.store.ts` (client `Zaya-orders` log). No detailed view, no timeline.

**Implementation sketch for Zaya:**
- Small, high-value. Add an order-details view reading from the existing `orders.store` (gate on `useHydrated()` per rule #7).
- Status timeline CSS-only per rule #8 (`animate-fade-up`, `stagger`) — no libraries.
- COD dropshipping statuses: `placed → confirmed → sourced → shipped → out for delivery → delivered`.
- **Static for now:** seed each order with a dummy status (e.g. `placed` or `confirmed`) in `orders.store`, and render the timeline up to that step. Real status updates come from the backend later.

---

## 4. Promo Code (cart) `promo_code`

**order-base:** Cart sub-feature — `PromoCode.tsx` applies a discount code and recomputes the summary.

**Zaya today:** **Mostly already built.** `CartDrawer.tsx` already has `couponInput`, `applyCoupon`, `removeCoupon`, `couponCode`, and a `selectCartDiscount` selector in the cart store. So the core is done.

**Implementation sketch for Zaya (only refinements left):**
- Confirm valid codes come from a `promos.data.ts` dummy layer (rule #4) rather than being hardcoded in the store.
- Confirm interaction with `FREE_SHIPPING_THRESHOLD` — recommend applying the discount first, then evaluating free shipping on the discounted subtotal.
- Make sure the same promo UI is available on the full cart page / checkout, not only the drawer.

---

## 5. Order Note (cart) `order_note`

**order-base:** Cart sub-feature — `OrderNote.tsx`, a free-text note carried into the order.

**Zaya today:** None.

**Implementation sketch for Zaya:** Trivial. Add an optional note field to cart/checkout, persist it on the order object in `orders.store`, show it on order confirmation/details. Useful for COD delivery instructions.

---

## 6. My Wallet `account_wallet`

**order-base:** Account sub-feature (`MyWallet.tsx`) — store credit / balance. Disabled by default even in order-base.

**Zaya today:** Account has orders / favorites / addresses / profile stores, but no wallet.

**Implementation sketch for Zaya:** Low priority. **Static for now:** if you build it, back it with a dummy balance + a mock transaction list in a persisted store — display only, no real crediting. Real balances/refunds come with the backend. Otherwise defer.

---

## 7. Product list sorting (NEW)

**Goal:** Let shoppers sort the product grid — by price (low→high, high→low), newest, and best-selling.

**Zaya today:** `ShopView.tsx` filters by category and by a text search, but there is **no sort** control. Products render in data order.

**Implementation sketch for Zaya:**
- Add a sort `<select>` next to the existing search input in `ShopView.tsx` (same row as `CategoryPills` + search).
- Options: `Featured` (default / current order), `Price: Low to High`, `Price: High to Low`, `Newest`, `Best Selling`.
- Sort on the **selling price**, not `basePrice` — compute via `getSellPrice(product.basePrice)` so ordering matches what the customer sees.
- Do it inside the existing `useMemo` that already produces `filteredData`; add a `sortBy` state and extend the memo (keep filter → then sort). No new dependency.
- "Newest" → sort by a `createdAt`/`id` field; "Best Selling" → by `product.tags?.includes('best seller')` or a `salesCount` field if added to the data layer.
- Optional: persist the chosen sort with the `useHydrated` pattern or `localStorage` so it survives navigation (matches order-base's product-search store approach).

---

## 8. Beautify product card + remove rating (NEW)

**Goal:** Make `ProductCard.tsx` look more premium and **remove the star rating / review count** from the card.

**Zaya today:** `src/features/shop/components/ProductCard.tsx` renders, between the title and price, a rating row:

```tsx
<div className="flex items-center gap-1 text-xs text-text-muted">
  <Star className="size-3.5 fill-brand-accent text-brand-accent" />
  <span className="font-medium text-text-secondary">{product.rating}</span>
  <span>({product.reviewCount})</span>
</div>
```

**Implementation sketch for Zaya:**
- **Remove** the rating block above and drop the now-unused `Star` import from `lucide-react`. (Rating/reviews can still live on the product **detail** page via `ProductReviews.tsx` — this only removes it from the card.)
- Beautification ideas (keep Tailwind v4 tokens, CSS-only animations per rule #8):
  - Reveal the "Add to cart" button on hover for a cleaner resting state (fade/slide up with existing `animate-*` utilities); keep it always visible on touch/mobile for accessibility.
  - Show a second product image on hover (crossfade `images[1]` over `images[0]`) if a second image exists.
  - Softer card: larger radius, subtle ring/border, gentle shadow lift already present — refine spacing and let the image breathe.
  - Price emphasis: make the selling price the clear focal point; show the compare-at strike price with a small "Save X%" pill when `compareAtPrice` exists.
  - Keep the Best Seller / Sale / Sold Out badges, keep the `QuantityStepper` swap behavior.
- Keep `next/image` with `width`/`height` and `getSellPrice` — no raw `<img>`, no hardcoded prices.
- Accessibility: keep the `aria-label` on the add button; ensure hover-only controls are still reachable by keyboard/touch.

---

## 9. Recommended products in cart drawer (NEW)

**Goal:** Show a "You may also like" / recommended-products slider inside the cart drawer, like order-base's cart. Encourages add-ons before checkout.

**order-base:** `RecommendedProducts.tsx` (a slider in the cart) and `CartMoreProducts.tsx` (grid/slider under the cart). It filters products tagged `recommended`, in stock, and not already in the cart, then shows them in a swipeable row with a quick "+" add button.

**Zaya today:** The cart drawer (`CartDrawer.tsx`) has items, coupon, free-shipping progress, and totals — but **no recommended-products section**. Note: the data side is already there — `products.service.ts` exposes `getRelatedProducts`, `getNewArrivals`, and `getFeaturedProducts`.

**Implementation sketch for Zaya:**
- Add a `CartRecommendations` component inside `features/cart/`, rendered near the bottom of the drawer (above or below the checkout button).
- Source products from the existing service — `getFeaturedProducts()` or `getNewArrivals()` (or add a `getRecommended()` that reads a `recommended`/`best seller` tag). Fetch via a React Query hook, not directly in the component (rule #3 / services).
- Filter: in stock **and not already in the cart** (compare against `useCartStore` items), like order-base does.
- **Do NOT use Swiper** — order-base pulls in `swiper`, but Zaya rule #8 is CSS-only, no animation/carousel libraries. Build a horizontal scroll row with CSS scroll-snap (`overflow-x-auto`, `snap-x snap-mandatory`, `snap-start` on cards). Hide the scrollbar with existing utilities.
- Reuse the redesigned `ProductCard` (compact variant) or a slim mini-card with image, name, `getSellPrice`, and a "+" add button wired to `useCartStore.addItem`.
- Gate on `useHydrated()` since it reads the persisted cart (rule #7). Hide the whole section when there are no eligible products.
- Optional: also add a `CartMoreProducts`-style section on the full `/cart` page for more room.

## 10. Wishlist heart on products (NEW)

**Goal:** Let shoppers save products to a wishlist by tapping a heart on the product card and product detail page.

**Zaya today:** **Half built.** There is already a persisted favorites store (`features/account/store/favorites.store.ts` → `Zaya-favorites`, with `toggle` / `isFavorite`) and a `/account/favorites` page (`FavoritesGrid.tsx`). Its empty state literally says "tap the heart on any product to save it here" — but **there is no heart button anywhere** on `ProductCard.tsx` or the product detail page yet. So the wishlist plumbing exists; only the trigger UI is missing.

**Implementation sketch for Zaya:**
- Add a heart toggle button to `ProductCard.tsx` (top-right corner over the image), wired to `useFavoritesStore().toggle(product.id)` and reflecting `isFavorite(product.id)`.
- Add the same heart to the product detail page (`features/product/components/ProductDetails.tsx`).
- Filled heart when saved, outline when not; use the existing `Heart` icon from `lucide-react` (already used in `FavoritesGrid`).
- Gate any card that reads favorite state on `useHydrated()` (rule #7) so hover/state doesn't flicker on hydration; keep the add-to-cart button separate from the heart.
- Accessibility: `aria-label` + `aria-pressed` on the heart button (rule: icon buttons need labels).
- Nice-to-have: a small `animate-pop` when toggling on (CSS-only, rule #8).
- No new store or data needed — it all flows into the existing `/account/favorites` page automatically.

> Tip: build this together with #8 (product-card redesign) since both edit `ProductCard.tsx`.

## Suggested order of work

1. **Product list sorting (#7)**, **Product card redesign (#8)**, **Wishlist heart (#10)**, **Recommended products in cart (#9)** — small, visible, no backend needed. Do first. (#8 and #10 both touch `ProductCard.tsx` — do them together.)
2. **Order Details + timeline (#3)** — small, high value. Finish **Promo Code (#4)** refinements.
3. **Order Note (#5)**.
4. **Feature Toggle System (#2)** — unlocks Zaya-as-reusable-theme.
5. **User Auth (#1)** — once you commit to a backend / persistent accounts.
6. **Wallet (#6)** later.

## Cross-cutting reminders when porting into Zaya

- Everything reads from the dummy data layer (`src/shared/data/`) via services until `API.md` exists (rule #4).
- No `any`, no Redux; Zustand (persisted) + React Query (rule #5).
- Any component reading a persisted store must gate on `useHydrated()` (rule #7).
- Animations CSS-only, respect `prefers-reduced-motion` (rule #8).
- Prices always via `getSellPrice()` — never hardcode (Zaya pricing rule).
- Add metadata + canonical + sitemap entry for any new page; keep existing SEO intact.
- pnpm, not npm.
