# Mobile Improvement Plan — Product List + Full Mobile UX

> **Why this doc:** ~80% of Sqoosh customers shop on phones (Instagram/TikTok traffic opens
> in in-app browsers on iOS Safari / Android Chrome). The desktop experience is fine; mobile
> must become the primary experience, not a shrunken desktop.
>
> **How to use:** every item has an ID (`M-xx`), the problem, the exact change, files, and
> platform notes — extract `tasks.md` directly from the item list (one checkbox per ID,
> grouped by phase). Rules from `CLAUDE.md` apply everywhere: tokens only, CSS-only
> animations, `aria-label`s, `useHydrated()` for persisted stores, no `any`.
>
> **Audit source:** `ShopView.tsx`, `ProductGrid/Card/CategoryPills/ProductSort`,
> `Header/MobileNavDrawer`, `ProductGallery`, `StickyBuyBar`, `WhatsAppButton`,
> `WelcomeOfferPopup/Strip`, `CartDrawer`, `CheckoutForm`, `app/layout.tsx`, `globals.css`.

---

## Phase 0 — Global mobile foundation (do first; everything depends on it)

### M-01 · Viewport + theme color (iOS notch & Android chrome)
**Problem:** `app/layout.tsx` exports no viewport config — no `viewport-fit=cover`
(content can hide under the iPhone notch/home indicator), no Android `theme-color`.
**Change:** add to `src/app/layout.tsx`:
```ts
import type { Viewport } from 'next';
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',            // iOS: enable env(safe-area-inset-*)
  themeColor: '#129488',           // Android address bar tint (brand teal) — reference tokens in a comment
};
```
**iOS:** enables `env(safe-area-inset-*)` everywhere. **Android:** tints Chrome's UI teal.

### M-02 · Safe-area insets on every fixed element
**Problem:** only `StickyBuyBar` uses `env(safe-area-inset-bottom)`. The WhatsApp FAB,
`WelcomeOfferPopup` (bottom sheet on mobile), `CartDrawer`, `MobileNavDrawer`, and the
sticky header ignore notches/home indicator.
**Change:** add `pb-[max(<pad>,env(safe-area-inset-bottom))]` (and `pt-…-top` for the
sticky header on landscape) to: `WhatsAppButton` wrapper, `WelcomeOfferPopup` outer flex
(`p-4` → include inset), `CartDrawer` footer, `MobileNavDrawer` bottom links, checkout
submit container.
**iOS:** critical (home indicator overlaps buttons). **Android:** harmless no-op on most
devices; needed for gesture-nav phones.

### M-03 · Kill iOS input auto-zoom (16px inputs on mobile)
**Problem:** `Input.tsx`, `Select.tsx`, and the shop search input use `text-sm` (14px).
iOS Safari auto-zooms the whole page when focusing any input < 16px — the #1 "site feels
broken" symptom on iPhone.
**Change:** in `src/shared/components/ui/Input.tsx` + `Select.tsx` + `SearchInput.tsx` +
shop search input + checkout/auth forms: `text-base sm:text-sm` (16px on mobile, 14px from
`sm` up). One-line class change per component — do NOT use `maximum-scale=1` (breaks
accessibility zoom; Android ignores it anyway).
**iOS:** fixes zoom. **Android:** no zoom behavior; visual consistency only.

### M-04 · Touch targets ≥ 44px
**Problem:** several controls are below Apple's 44pt / Android's 48dp minimum:
`ProductCard` quick-add + `WishlistButton` (36px), gallery thumbnails' tap area,
`QuantityStepper` buttons (32px), popup close X, announcement bar link height.
**Change:** bump interactive elements to `size-11` (44px) on mobile (`size-11 sm:size-9`
where desktop density matters); ensure spacing between adjacent targets ≥ 8px. Audit with
Chrome DevTools mobile emulation + the tap-target Lighthouse audit.
**Both platforms:** identical requirement (44px covers 48dp at typical DPRs).

### M-05 · Dynamic viewport height (`dvh`) for drawers/sheets
**Problem:** iOS Safari's collapsing URL bar makes `h-screen`/`100vh` overflow — drawer
footers (cart "Checkout" button) can sit off-screen.
**Change:** in `Drawer.tsx`, `CartDrawer`, `MobileNavDrawer`, any `h-screen`/`min-h-screen`
overlay: use `h-dvh` (Tailwind v4 supports it) with `h-screen` as the natural fallback.
Add `overscroll-contain` to drawer scroll areas so background doesn't scroll-chain.
**iOS:** the actual bug. **Android:** Chrome 108+ same benefit with keyboard open.

### M-06 · Android back button / swipe-back closes overlays
**Problem:** on Android, pressing back while `CartDrawer` / `MobileNavDrawer` / search
modal / `WelcomeOfferPopup` is open navigates away instead of closing the overlay —
users lose their place and often leave the site.
**Change:** small shared hook `useBackButtonClose(open, onClose)` in `src/shared/hooks/`:
on open → `history.pushState({overlay:true})`; on `popstate` → call `onClose()` and swallow
the entry; on normal close → `history.back()` guarded against double-pop. Wire into the four
overlay components.
**Android:** primary fix (hardware/gesture back). **iOS:** also improves edge-swipe-back
behavior in Safari.

### M-07 · Tap feedback + touch CSS hygiene
**Problem:** buttons/cards rely on `hover:` states that don't exist on touch; taps feel
dead; iOS shows the default grey tap flash.
**Change:** in `globals.css`: `-webkit-tap-highlight-color: transparent;` on the body, and
add `active:scale-[0.97]` (or `active:opacity-80`) transitions to `Button`, `ProductCard`,
category pills, nav links; `touch-action: manipulation` on buttons/links to remove the
300ms-double-tap ambiguity in in-app browsers. Respect `prefers-reduced-motion` (global
rule already handles animation utilities).
**Both platforms.**

### M-08 · PWA basics: manifest + icons
**Problem:** no `manifest`, no `apple-touch-icon` — "Add to Home Screen" (common from
Instagram browser → "open in Safari/Chrome" flow) shows a blank icon and generic name.
**Change:** add `src/app/manifest.ts` (name "Sqoosh", theme/background from brand tokens,
icons 192/512 from the logo) and `apple-touch-icon` via layout `icons` metadata (180×180
png in `/public`). No service worker / offline scope for now.
**iOS:** uses apple-touch-icon. **Android:** uses manifest icons + install prompt.

---

## Phase 1 — Product list (shop page) mobile redesign  ★ the money screen

Current mobile problems (`ShopView.tsx`): the eyebrow + big title + pills + full-width
search + full-width sort stack ≈ 1.5 screens before the first product; search is 14px
(zoom bug); no product count; no tag filters (glow/food/animal exist only as data); tools
scroll away so refining means scrolling back up; plain-text empty state.

### M-10 · Compact header: products visible in the first viewport
**Change:** on mobile, shrink the page header to one line (`text-2xl`, drop the eyebrow to
`sr-only`), and show a product count under it ("24 squishies"). Target: first product row
visible within one viewport (375×667) without scrolling.
**Files:** `ShopView.tsx`.

### M-11 · Sticky filter toolbar
**Change:** merge category pills + search toggle + sort into ONE sticky row
(`sticky top-16 z-30 bg-surface/95 backdrop-blur`, under the sticky header): horizontally
scrollable `CategoryPills` (keep), a search icon button that expands to a full-width input
(auto-focused, 16px per M-03), and a compact sort button. On `sm+` keep the current layout.
Sticky means refining never requires scrolling back up.
**Files:** `ShopView.tsx`, `CategoryPills.tsx`. Add `scroll-snap-type: x proximity` to the
pill row and a right-edge fade mask so users see it scrolls.

### M-12 · Sort as bottom sheet on mobile
**Change:** replace the `<select>` with a button ("Sort · Newest") opening a bottom sheet
(reuse `Drawer` in bottom-sheet mode or a small new `BottomSheet` in `shared/components/ui`)
listing `SORT_OPTIONS` as large radio rows (48px). Native `<select>` stays on `sm+`
(`ProductSort` keeps working there). Sheet: safe-area padding (M-02), back-button close
(M-06), `overscroll-contain`.
**Files:** `ProductSort.tsx`, `ShopView.tsx`, optional `BottomSheet.tsx`.
**iOS note:** native select wheel is actually decent — keep `<select>` as fallback if the
sheet is cut for time; the sheet wins because options show prices context and larger targets.

### M-13 · Theme tag filter chips (glow / food / animal / …)
**Problem:** themes are product **tags** (per catalog doc) but the storefront has zero tag
filtering — mobile users can't reach "glow squishies" in one tap.
**Change:** second chip row (or same row after categories, visually separated) with the
distinct tags of the loaded product set; multi-select toggles client-side filtering
(`tags.includes`) combined with search + sort. Selected chips: filled teal. Persist in the
URL (`?tags=glow,food`) for shareable links from IG bios.
**Files:** `ShopView.tsx` (filter state), small `TagChips.tsx` in `features/shop`.

### M-14 · Product card mobile ergonomics
**Change:** in `ProductCard.tsx`: quick-add + wishlist to 44px (M-04); keep quick-add
always visible on mobile (already is — verify after M-04); `line-clamp-1` the name on
mobile to keep rows even; ensure price stays the visually loudest element; add
`loading="lazy"`-equivalent (next/image default) and correct `sizes` for the 2-col mobile
grid (`50vw`). Add a subtle "Added ✓" state on quick-add (`animate-pop`) — currently only
the stepper appears, which users miss.
**Files:** `ProductCard.tsx`.

### M-15 · Grid density + spacing on small screens
**Change:** `ProductGrid.tsx`: keep 2 columns but tighten mobile gap (`gap-3`), and cap the
stagger animation index (long lists currently stagger every card — cards far down animate
long after scroll; cap `--stagger-i` at ~8 or apply only to the first rows).
**Files:** `ProductGrid.tsx`.

### M-16 · Better empty & no-results states
**Change:** replace the plain `<p>` with a friendly block: emoji, "No squishies match" +
active-filter summary, and two actions: "Clear filters" (resets search/tags/sort) and
"Browse all". Also a distinct state for a truly empty category.
**Files:** `ProductGrid.tsx` (accept an `onClear?` prop) or inline in `ShopView.tsx`.

### M-17 · "Load more" pagination for long lists
**Problem:** the full category renders at once; as the catalog grows this hurts scroll
performance on low-end Android.
**Change:** client-side windowing-lite: render the first 12, then a "Load more (n left)"
button (`h-12`, full width) appending 12 at a time. No API change (list is already loaded);
this is a render cap, not fetch pagination. Note in code: replace with real API pagination
when catalog > ~100 items.
**Files:** `ShopView.tsx`.

---

## Phase 2 — Product page (PDP) mobile

### M-20 · Swipeable gallery
**Problem:** `ProductGallery` is tap-thumbnails only — every mobile user tries to swipe
first. **Change:** rebuild the main image area as a horizontal scroll-snap track
(`overflow-x-auto snap-x snap-mandatory`, each image `snap-center shrink-0 w-full`) — CSS
scroll-snap only, **no JS animation libs** (rule 7). Sync active dot/thumbnail via
`onScroll` + `IntersectionObserver`. Keep thumbnails on `md+`; on mobile show dots.
**iOS/Android:** native momentum scrolling both; add `scrollbar-width:none`.
**Files:** `ProductGallery.tsx`.

### M-21 · FAB vs sticky-buy-bar collision
**Problem:** the WhatsApp FAB (`fixed bottom-6 right-6 z-9999`) overlaps `StickyBuyBar`
(`bottom-0 z-40`) on mobile PDP — it can cover the Add-to-bag button edge, and its greeting
bubble covers the price.
**Change:** on PDP mobile, lift the FAB above the bar (`bottom-24`) via a `data-` attribute
or pathname check inside `WhatsAppButton`; suppress the auto greeting bubble on mobile
viewports entirely (it's the most intrusive element on a small screen). Also z-index sanity:
FAB `z-40`, never above modals (currently `z-9999` sits above the cart drawer overlay).
**Files:** `WhatsAppButton.tsx`, possibly `StorefrontChrome.tsx` (pass current pathname).

### M-22 · PDP content order for mobile
**Change:** verify mobile order is: gallery → name+price+rating → add to bag → shipping
ETA/COD trust line → bundle hints → description (collapsible `<details>` if long) →
reviews → related. Move anything currently forcing users to scroll past long description
before the buy button. Sticky bar (exists) covers the rest.
**Files:** `ProductDetails.tsx`.

---

## Phase 3 — Cart, checkout & overlays on mobile

### M-30 · Cart drawer → full-height mobile sheet
**Change:** `CartDrawer` on mobile: full-width, `h-dvh` (M-05), header with close +
item count, scrollable items (`overscroll-contain`), pinned footer (free-shipping progress +
subtotal + Checkout button + safe-area). Swipe-down-to-close optional later — X + back
button (M-06) are enough now.
**Files:** `CartDrawer.tsx`, `Drawer.tsx`.

### M-31 · Checkout form mobile pass
**Change:** in `CheckoutForm.tsx` (319 lines, already has `inputMode`/`autoComplete` —
good): 16px inputs (M-03); phone field `type="tel"`; governorate select 16px; submit
button sticky at the bottom on mobile with the order total inside the label
("Place order · EGP 540") + safe-area; error summary scrolls to the first invalid field
(`scrollIntoView({block:'center'})`); COD explainer visible without scrolling on 375px.
**iOS:** `autoComplete="tel"` triggers the contact autofill bar. **Android:** numeric keypad
via existing `inputMode="numeric"` — keep.
**Files:** `CheckoutForm.tsx`.

### M-32 · Popup orchestration on mobile (don't stack interruptions)
**Problem:** minute one on mobile can show: announcement bar + welcome popup (4s) +
WhatsApp greeting bubble (3.5s) + sticky elements — too much for a 375px screen.
**Change:** single rule: at most ONE proactive interruption per session on mobile.
Welcome popup keeps priority; suppress the WhatsApp greeting bubble when the popup hasn't
been dismissed yet (read the popup's localStorage key) and always on mobile (M-21).
Popup already renders as bottom sheet (`items-end`) — add safe-area (M-02) and back-button
close (M-06).
**Files:** `WhatsAppButton.tsx`, `WelcomeOfferPopup.tsx`.

### M-33 · Header slim-down on scroll
**Change:** on mobile, hide the announcement bar once scrolled past ~200px (CSS sticky
header keeps 64px). Cheap version: announcement bar not sticky (scrolls away naturally) —
verify it's outside the sticky wrapper; currently it's INSIDE the sticky `<header>`,
costing 36px of every mobile viewport. Move it above/outside the sticky container.
**Files:** `Header.tsx`.

---

## Phase 4 — Performance on real phones (in-app browsers are slow)

### M-40 · Image discipline
`sizes` audit for every grid/hero image (mobile 50vw/100vw correctness), keep only the
hero `priority`, everything else lazy (next/image default). Placeholder SVGs are light
today — re-verify when real photos land (target ≤ 120KB per grid image, WebP).

### M-41 · JS on the shop route
`ShopView` is fully client-rendered via React Query. Keep for now (matches architecture),
but: memoize `ProductCard` (`React.memo`) so search/tag filtering doesn't re-render the
whole grid per keystroke, and debounce the search input filter (150ms).
**Files:** `ProductCard.tsx`, `ShopView.tsx`.

### M-42 · CWV budget check
After Phases 0–3: Lighthouse mobile (throttled) on `/`, `/shop`, `/product/[id]`,
`/checkout`. Budgets: LCP < 2.5s, CLS < 0.05, INP < 200ms. Track remaining gaps in
`docs/performance-seo-plan.md` (don't fork a second perf backlog).

---

## Platform checklists (apply per task, verify at the end)

**iOS (Safari + Instagram/TikTok in-app webview):**
16px inputs (M-03) · safe-area everywhere (M-01/02) · `dvh` drawers (M-05) · no
`maximum-scale` · `-webkit-tap-highlight-color` (M-07) · apple-touch-icon (M-08) ·
clipboard writes need user-gesture context (already the case for FIRST20 copy buttons) ·
test the IG in-app browser specifically — it adds its own bottom bar (safe-area covers it).

**Android (Chrome + in-app webviews):**
back button closes overlays (M-06) · theme-color (M-01) · manifest icons (M-08) ·
48dp targets (M-04) · keyboard resize: with `dvh` + pinned footers, verify the checkout
submit stays visible while typing (M-31) · low-end perf budget (M-40..42).

## Test matrix (minimum before calling mobile "done")

| Device/context | What to run |
| --- | --- |
| iPhone SE/13 — Safari | Full buy flow: home → shop → filter → PDP → cart → checkout (COD) |
| iPhone — Instagram in-app browser | Landing from bio link, FIRST20 copy, popup, buy flow |
| Mid/low-end Android — Chrome | Same flow + back-button behavior on every overlay |
| Android — TikTok in-app browser | Landing + add to cart |
| Both | Rotate to landscape on PDP + checkout (nothing breaks) |

## Extracting `tasks.md`

Create `docs/mobile-tasks.md` with one checkbox per M-ID in this order:
**Phase 0 (M-01…M-08) → Phase 1 (M-10…M-17) → Phase 2 (M-20…M-22) → Phase 3
(M-30…M-33) → Phase 4 (M-40…M-42)**, each carrying its Files line as sub-bullets and the
platform notes as acceptance criteria. Verification block after every phase:
`pnpm build && pnpm typecheck && pnpm lint && pnpm assert:no-secrets` + the test matrix
row(s) touched. Phase 1 is the revenue-critical one; Phase 0 must land first because
Phases 1–3 build on M-02/03/04/05/06.
