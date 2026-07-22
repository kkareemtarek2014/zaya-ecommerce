# Mobile tasks — Sqoosh

Extracted from [mobile-improvement-plan.md](./mobile-improvement-plan.md).
Check off each ID after implementation + verification.

## Phase 0 — Global mobile foundation

- [x] **M-01** Viewport + theme color (`viewportFit: 'cover'`, `themeColor`)
  - Files: `src/app/layout.tsx`
  - Accept: iOS `env(safe-area-inset-*)` enabled; Android Chrome tinted teal
- [x] **M-02** Safe-area insets on fixed / sticky chrome
  - Files: `WhatsAppButton`, `WelcomeOfferPopup`, `Drawer` (cart + nav inherit), `CheckoutForm`, `Header`
  - Accept: home indicator / notch do not cover FABs, drawers, checkout submit, sticky header
- [x] **M-03** Kill iOS input auto-zoom (`text-base sm:text-sm`)
  - Files: `Input`, `Select`, `SearchInput`, shop/auth/search/cart/newsletter raw inputs
  - Accept: focusing inputs on iPhone does not zoom the page
- [x] **M-04** Touch targets ≥ 44px
  - Files: `ProductCard`, `WishlistButton`, `QuantityStepper`, close buttons, `AnnouncementBar`
  - Accept: tap targets ≥ 44px on mobile; denser `sm:` sizes where noted
- [x] **M-05** Dynamic viewport height (`h-dvh` + `overscroll-contain`)
  - Files: `Drawer.tsx`
  - Accept: cart/nav drawer footers stay on-screen with collapsing iOS URL bar
- [x] **M-06** Android back / swipe-back closes overlays
  - Files: `useBackButtonClose.ts`, `Drawer`, `SearchModal`, `WelcomeOfferPopup`
  - Accept: back closes overlay without leaving the page
- [x] **M-07** Tap feedback + touch CSS hygiene
  - Files: `globals.css`, `ProductCard`, `CategoryPills`, mobile nav links
  - Accept: no grey iOS tap flash; `active:` feedback on cards/pills/nav
- [x] **M-08** PWA basics (manifest + icons)
  - Files: `src/app/manifest.ts`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, layout `icons`
  - Accept: Add to Home Screen shows Sqoosh name + icon

### Phase 0 verification

```bash
pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```

## Phase 1 — Product list (shop page)

- [x] **M-10** Compact header + product count
  - Files: `ShopView.tsx`
  - Accept: first product row visible in 375×667 without scrolling; count shows “N squishies”
- [x] **M-11** Sticky filter toolbar
  - Files: `ShopView.tsx`, `CategoryPills.tsx`
  - Accept: sticky under header on mobile; pills snap + edge fade; search expands; `sm+` keeps stacked layout
- [x] **M-12** Sort as bottom sheet on mobile
  - Files: `BottomSheet.tsx`, `ProductSort.tsx`
  - Accept: sheet with 48px rows + back-button close; native `<select>` on `sm+`
- [x] **M-13** Theme tag filter chips + `?tags=`
  - Files: `TagChips.tsx`, `ShopView.tsx`
  - Accept: multi-select theme tags; URL shareable; combines with search + sort
- [x] **M-14** Product card mobile ergonomics
  - Files: `ProductCard.tsx`
  - Accept: `line-clamp-1` mobile; Added ✓ flash; 44px quick-add; `sizes` 50vw
- [x] **M-15** Grid density + stagger cap
  - Files: `ProductGrid.tsx`
  - Accept: `gap-3` mobile; `--stagger-i` capped at 8
- [x] **M-16** Empty & no-results states
  - Files: `ProductGrid.tsx`, `ShopView.tsx`
  - Accept: distinct empty-category vs no-results; Clear filters + Browse all
- [x] **M-17** Load more (12 at a time)
  - Files: `ShopView.tsx`
  - Accept: first 12 rendered; “Load more (n left)” appends 12; resets on filter change

### Phase 1 verification

```bash
pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```

## Phase 2 — Product page (PDP)

- [x] **M-20** Swipeable gallery (CSS scroll-snap)
  - Files: `ProductGallery.tsx`
  - Accept: swipe snaps between images; mobile dots; `md+` thumbs; IO syncs active index
- [x] **M-21** FAB vs sticky-buy-bar collision
  - Files: `WhatsAppButton.tsx`, `StorefrontChrome.tsx`
  - Accept: PDP FAB lifted above bar; no greeting bubble on mobile; FAB `z-40` below modals
- [x] **M-22** PDP content order
  - Files: `ProductDetails.tsx`
  - Accept: gallery → name/price/rating → add to bag → shipping/COD → bundles → collapsible description → reviews → related

### Phase 2 verification

```bash
pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```

## Phase 3 — Cart, checkout & overlays

- [x] **M-30** Cart drawer → full-height mobile sheet
  - Files: `Drawer.tsx` (`footer`, `fullWidthMobile`), `CartDrawer.tsx`
  - Accept: full-width `h-dvh` on mobile; pinned footer with checkout + safe-area; scrollable items
- [x] **M-31** Checkout form mobile pass
  - Files: `CheckoutForm.tsx`
  - Accept: sticky submit with total in label; `type="tel"`; scroll to first error; COD visible in first viewport
- [x] **M-32** Popup orchestration on mobile
  - Files: `WhatsAppButton.tsx` (WelcomeOfferPopup already has safe-area + back close)
  - Accept: at most one proactive interruption; WA greeting suppressed on mobile + while welcome pending
- [x] **M-33** Header slim-down — announcement outside sticky
  - Files: `Header.tsx`
  - Accept: announcement scrolls away; sticky header stays ~64px (+ safe-area)

### Phase 3 verification

```bash
pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```

## Phase 4 — Performance on real phones

- [x] **M-40** Image discipline (`sizes` + LCP `priority` only on heroes / gallery[0])
  - Files: homepage heroes, BundleSpotlight, ProductCard/grid, gallery thumbs, cart/order/search thumbs, FavoritesGrid
  - Accept: mobile `50vw`/`100vw` correct; no extra `priority` below the fold
- [x] **M-41** Shop JS — memo ProductCard + debounce search 150ms
  - Files: `ProductCard.tsx`, `ShopView.tsx`, `useDebouncedValue.ts`
  - Accept: typing in shop search does not re-filter/re-render every keystroke immediately
- [x] **M-42** CWV budget check tracked in perf plan
  - Files: `docs/performance-seo-plan.md` (Mobile Phase 4 section)
  - Accept: budgets LCP &lt; 2.5s / CLS &lt; 0.05 / INP &lt; 200ms listed; remaining gaps stay in that doc

### Phase 4 verification

```bash
pnpm typecheck && pnpm lint && pnpm assert:no-secrets
```
