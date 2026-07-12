# Zaya — Claude Code Project Brain

> Read this file at the start of EVERY session before touching code.

---

## What This Is

**Zaya** (زينة, "adornment") is a women's accessories e-commerce storefront for Egypt, targeting Class A/B customers. Business model: dropshipping — products sourced from Temu/Shein-style suppliers, sold with a 20–30% margin, delivered across Egypt with cash on delivery.

Frontend only for now. An admin dashboard + real backend come later.

## Business Rules (single source: `src/config/site.config.ts`)

| Rule | Value | Where |
| --- | --- | --- |
| Profit margin | 25% (allowed 20–30%) | `PROFIT_MARGIN` |
| Shipping Cairo/Giza | 50 EGP | `SHIPPING_RATES.cairo_giza` |
| Shipping nearby governorates | 80 EGP | `SHIPPING_RATES.near` |
| Shipping far (Upper Egypt/Sinai) | 100 EGP | `SHIPPING_RATES.far` |
| Free shipping | orders ≥ 1,500 EGP | `FREE_SHIPPING_THRESHOLD` |
| Payment | Cash on delivery only (cards later) | checkout feature |
| Domain (placeholder) | `SITE.url` — update when real domain bought | |

**Pricing model:** products store `basePrice` (sourcing cost in EGP). Customer price = `getSellPrice()` in `src/shared/utils/price.ts` — cost + margin, rounded UP to nearest 5 EGP. Never hardcode selling prices.

**Governorate → zone mapping:** `src/shared/data/governorates.data.ts` (all 27 governorates).

## Stack

- Next.js (App Router) + React + TypeScript `strict: true`
- Tailwind CSS **v4** (CSS-first config — tokens in `src/styles/tokens.css`, mapped via `@theme inline` in `src/app/globals.css`; there is NO tailwind.config.ts)
- Zustand (client state, persisted) + React Query (server state)
- react-hook-form + Zod v4 on every form
- lucide-react icons · pnpm

## Architecture Rules — NON-NEGOTIABLE

1. **One directory per feature** under `src/features/` — UI, hooks, store, schema, services live inside it.
2. **Barrel exports** — external code imports ONLY from `features/[name]/index.ts`, never deep paths.
3. **All data access via services** — `features/shop/services/products.service.ts`. Components never import data files directly (data files in `shared/data/` are the dummy layer).
4. **Dummy data layer** — Temu has no public API. Everything reads from `src/shared/data/`. When the real backend exists, document it in `API.md` and change ONLY service bodies / store submit functions.
5. **No `any`**, no Redux, no tokens in localStorage (only cart/order/request metadata is persisted client-side).
6. **Mobile-first** Tailwind; WCAG: icon buttons need `aria-label`, forms use real `<label>`s.
7. **Hydration**: any component reading persisted Zustand stores must gate on `useHydrated()` (`src/shared/hooks/useHydrated.ts`) — NOT `useEffect(() => setMounted(true))` (lint error).
8. **Animations are CSS-only** — utilities `animate-fade-up`, `animate-pop`, `stagger` in `globals.css`. No animation libraries. Respect `prefers-reduced-motion` (already handled globally).

## Features Map

| Feature | Path | Notes |
| --- | --- | --- |
| Shop/catalog | `features/shop/` | grid, category pills, services, React Query hooks |
| Product details | `features/product/` | gallery + add to bag |
| Cart | `features/cart/` | `cart.store.ts` (Zustand persist `Zaya-cart`) |
| Checkout | `features/checkout/` | Zod schema (Egyptian phone regex), shipping calc |
| Orders | `features/order/` | client-side order log (`Zaya-orders`), confirmation page |
| Bridal custom | `features/bridal-custom/` | photo/video request form; replies promised ≤ 2 days; file itself NOT uploaded yet (needs backend) |

## Pages

`/` · `/shop` · `/shop/[category]` · `/product/[id]` · `/cart` · `/checkout` · `/order/[id]` · `/bride/custom`

Categories: jewelry, bags, hair, scarves, sunglasses, watches, **bride**.

## SEO (already implemented — keep it intact)

- `layout.tsx`: metadataBase, title template, OG/Twitter, robots, Organization+WebSite JSON-LD
- `product/[id]/page.tsx`: `generateMetadata` + Product JSON-LD (price, availability, rating)
- `shop/[category]`: per-category meta from `seoDescription` in categories data + `generateStaticParams`
- `app/sitemap.ts` + `app/robots.ts` (cart/checkout/order disallowed & noindexed)
- Keywords include Arabic terms (اكسسوارات حريمي, اكسسوارات فرح)
- When adding a page: add metadata + canonical + sitemap entry. When adding a category: fill `seoDescription`.

## Verification (run after every change group)

```bash
pnpm build      # 0 errors
pnpm typecheck  # 0 errors
pnpm lint       # 0 errors (1 known benign warning: react-hooks/incompatible-library on RHF watch())
```

## Conventions

Components PascalCase · hooks `useX` · dirs kebab-case · `*.types.ts` / `*.store.ts` / `*.service.ts` / `*.schema.ts` / `*.data.ts` / `*.config.ts` · conventional commits (`feat:`, `fix:`…).

## Known Placeholders / TODO

- Product images are gradient SVGs in `public/images/` — replace with real photos (keep same paths or update data files)
- `SITE.url` is a placeholder domain
- Bridal request uploads store file metadata only — real upload needs backend (multipart POST)
- `API.md` doesn't exist yet — create it when defining the backend contract
- Roadmap: dashboard, Paymob/Fawry payments, auth/accounts, Arabic RTL
