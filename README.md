<div align="center">
  <img src="https://via.placeholder.com/150x150/fdfbf7/c4a484?text=Z" alt="Zaya Logo" width="120" height="120" />
  <h1>✨ Zaya — Premium Women's Accessories ✨</h1>
  <p><strong>Curated women's accessories delivered anywhere in Egypt with Cash on Delivery.</strong></p>
  <p>Built as a sleek, feature-based Next.js storefront, perfectly engineered for scalability, stunning UI/UX, and robust performance.</p>
</div>

<hr />

## 🚀 Tech Stack

We leverage modern web technologies to ensure a blazingly fast and delightful shopping experience:

- **Framework:** Next.js (App Router) & React 19
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 (Mobile-first, Custom Brand Palette)
- **State Management:** Zustand (Persisted Cart)
- **Data Fetching:** React Query
- **Forms & Validation:** react-hook-form + Zod
- **Icons:** Lucide React

---

## 🛠️ Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation & Run
```bash
# 1. Install dependencies
pnpm install

# 2. Run the development server
pnpm dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Checks
Run these commands to verify code quality before deploying:
```bash
pnpm build      # Test production build
pnpm typecheck  # Verify TypeScript types
pnpm lint       # Run ESLint
```

---

## 💼 Business Rules & Configuration

All core business logic is centralized in one easy-to-manage file: **`src/config/site.config.ts`**.

| Setting | Description |
| :--- | :--- |
| **`PROFIT_MARGIN`** | Markup on sourcing cost (e.g., `0.25` = 25%). Allowed range: 20–30%. |
| **`SHIPPING_RATES`** | Flat rates by zone (e.g., Cairo/Giza: 50 EGP, Near: 80 EGP, Far: 100 EGP). |
| **`FREE_SHIPPING_THRESHOLD`** | Orders totaling above this amount automatically get free shipping! |
| **`SITE`** | Brand name, tagline, description, and currency (EGP). |

*(Note: Governorate-to-zone mappings live in `src/shared/data/governorates.data.ts`)*

---

## 💰 Dynamic Pricing Model

Products are stored with a base sourcing cost (`basePrice`).
The customer-facing price is dynamically computed by the `getSellPrice()` utility located in `src/shared/utils/price.ts`. 

**The formula:** `(Cost + Margin) → Rounded up to the nearest 5 EGP.`
Change the margin in `site.config.ts` once, and every single price across the site updates instantly!

---

## 🏗️ Project Architecture (Feature-Based)

We strictly follow a modular, feature-based architecture for clean separation of concerns.

```text
src/
├── app/            # Next.js App Router pages (UI layout only, no logic)
├── config/         # site.config.ts (Core business rules)
├── features/       # Modular features (barrel-exported via index.ts)
│   ├── shop/       # Catalog, product grid, category filter
│   ├── product/    # Product details & image galleries
│   ├── cart/       # Zustand cart store (persisted) + slide-out drawer
│   ├── checkout/   # Shipping calculator, robust Zod checkout form
│   └── order/      # Order log & confirmation page
├── shared/         # Global utilities & UI Kit
│   ├── components/ # Reusable UI components (Buttons, Inputs, Header, Footer)
│   ├── data/       # Dummy data layer (products, categories, zones)
│   ├── types/      # Global TypeScript interfaces
│   └── utils/      # Helpers (price formatters, cn utility)
└── styles/         # tokens.css (Brand palette — edit colors here)
```

**Architectural Rules:**
- Features must only import from another feature's `index.ts` (barrel file).
- Data access is abstracted through `features/*/services/`.
- Strict typing (No `any` allowed).
- All forms are bound with Zod schemas.

---

## 🔌 API & Backend Integration

Currently, the store reads from a robust dummy data layer (`src/shared/data/`). Once your backend or supplier feed is ready:

1. Document your API endpoints in `API.md`.
2. Replace the function bodies inside `src/features/shop/services/products.service.ts` and `src/features/checkout/services/orders.service.ts`.
3. **That's it.** Because components only communicate through services, no UI code needs to change!

---

## 🗺️ Sitemap

- `/` — Homepage (Hero, Featured Products)
- `/shop` — Full Catalog
- `/shop/[category]` — Filtered Catalog (Jewelry, Bags, Scarves, etc.)
- `/product/[id]` — Product Details
- `/cart` — Dedicated Cart Page (also available as a global drawer)
- `/checkout` — Secure Checkout Flow
- `/order/[id]` — Order Confirmation & Receipt
- `/about` — Our Story
- `/contact` — Customer Support & FAQ
- `/terms`, `/privacy` — Legal pages

---

## 🎯 Roadmap

- [ ] **Admin Dashboard:** Manage orders, edit catalog, and adjust margins dynamically.
- [ ] **Live Supplier Feed:** Automated product imports from supplier APIs.
- [ ] **Payment Gateway Integration:** Support for Paymob / Fawry alongside Cash on Delivery.
- [ ] **User Accounts:** Wishlists, order history, and saved addresses.
- [ ] **RTL Support:** Full Arabic localization for the Egyptian market.

---

<div align="center">
  <p>Crafted with elegance for Zaya.</p>
</div>