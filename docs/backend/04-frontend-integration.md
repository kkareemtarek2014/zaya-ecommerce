# 04 — Frontend Integration (swap static data → API)

Principle: **UI/UX does not change.** The only edits in `src/features/*` are (a) service bodies, (b) new
mutation hooks, (c) stores that used to write locally now call the API. Components keep their props and
markup. This is exactly the seam the codebase was built for ("replace ONLY these function bodies").

Everything below favors **small, reusable hooks and utilities** and keeps each feature self-contained
behind its barrel export.

---

## 1. The typed API client (one utility, used everywhere)

`src/shared/lib/api-client.ts` — a single fetch wrapper so no component hand-rolls fetch:

```ts
import type { ApiResponse } from '@/shared/contracts/envelope';
import { AppError } from '@/shared/contracts/errors';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',                 // send session cookie
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) throw new AppError(body.error.code, body.error.message, body.error.details);
  return body.data;
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) => request<T>(p, { method: 'POST', body: b ? JSON.stringify(b) : undefined }),
  put:  <T>(p: string, b?: unknown) => request<T>(p, { method: 'PUT', body: JSON.stringify(b) }),
  del:  <T>(p: string) => request<T>(p, { method: 'DELETE' }),
  postForm: <T>(p: string, fd: FormData) => request<T>(p, { method: 'POST', body: fd, headers: {} }),
};
```

Benefits: consistent error handling (throws `AppError` → React Query `error`), cookie handling in one
place, no `Content-Type` juggling for multipart.

---

## 2. Rewire the product service (bodies only)

`features/shop/services/products.service.ts` — signatures unchanged, remove the local array + fake
latency, call `api`:

```ts
export const getProducts = () => api.get<ProductDTO[]>('/api/products');
export const getProductsByCategory = (slug: string) =>
  api.get<ProductDTO[]>(`/api/products?category=${encodeURIComponent(slug)}`);
export const getFeaturedProducts = () => api.get<ProductDTO[]>('/api/products?featured=true');
export const getProductById = (id: string) => api.get<ProductDTO>(`/api/products/${id}`);
export const getCategories = () => api.get<Category[]>('/api/categories');
export const getRelatedProducts = (id: string, _c: string, limit = 4) =>
  api.get<ProductDTO[]>(`/api/products/${id}/related?limit=${limit}`);
export const getNewArrivals = (limit = 8) => api.get<ProductDTO[]>(`/api/products/new?limit=${limit}`);
export const searchProducts = (q: string) =>
  q.trim() ? api.get<ProductDTO[]>(`/api/products/search?q=${encodeURIComponent(q)}`) : Promise.resolve([]);
```

`useProducts.ts`, `useSearch.ts`, `useCartRecommendations.ts` **need no changes** — they already wrap
these functions in React Query. `ProductDTO` replaces `Product` in the client type (drop `basePrice`,
add `price`); update component code that called `getSellPrice(product.basePrice)` to read `product.price`
(the server already applied the margin). Grep for `basePrice` and `getSellPrice` in `features/*` and
`app/*` to find those spots (e.g. `ProductCard`, `ProductDetails`, `cart.store.addItem`).

> `cart.store.addItem` currently computes `getSellPrice(product.basePrice)`. With `ProductDTO` it uses
> `product.price` directly. Cart line prices are still re-verified server-side at checkout.

---

## 3. RSC pages (server components) — no self-fetch

Pages that render on the server (`/`, `/shop`, `/shop/[category]`, `/product/[id]`) should call the
**repository/service directly** rather than fetching their own API, to avoid an extra network hop and
keep SEO/SSR fast. Provide server-only helpers in `server/services/product.service.ts` returning the
same `ProductDTO`, and keep `generateMetadata` / `generateStaticParams` intact. Client components inside
those pages still use React Query hooks for interactivity. Both share the DTO mapper, so output matches.

---

## 4. New mutation hooks (writes)

Add React Query mutation hooks next to each feature (reusable, one responsibility each). Examples:

```ts
// features/checkout/hooks/usePlaceOrder.ts
export function usePlaceOrder() {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.post<OrderDTO>('/api/orders', input),
    onSuccess: (order) => { clear(); router.push(`/order/${order.id}`); },
  });
}
```

```ts
// features/auth/hooks/useLogin.ts / useRegister.ts / useForgotPassword.ts
export function useLogin() {
  const setUser = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (v: LoginValues) => api.post<UserDTO>('/api/auth/login', v),
    onSuccess: (user) => setUser(user),
  });
}
```

Other hooks to add (same pattern): `useRegister`, `useForgotPassword`, `useLogout`,
`useSubmitBridalRequest` (uses `api.postForm`), `useValidatePromo`, `useProfile`/`useUpdateProfile`,
`useAddresses`/`useAddAddress`/`useRemoveAddress`, `useFavoritesSync`, `useWallet`, `useReviews`.

Forms keep react-hook-form + Zod; the `onSubmit` calls `mutate()` and surfaces `error.message` and
`isPending` in the existing UI. No new UI components.

---

## 5. Stores after the migration

| Store | Change |
| --- | --- |
| `cart.store` | Keep as client cart. `applyCoupon` now calls `useValidatePromo` / `api.post('/api/promos/validate')` instead of the local `validatePromoCode`. Prices from `ProductDTO.price`. |
| `orders.store` | **Remove** local `placeOrder` write + mock order + persistence. Reads come from `GET /api/orders/[id]` and `GET /api/orders`. (Optionally keep a tiny "last order id" for confirmation UX.) |
| `bridal-requests.store` | `submitRequest` → real multipart POST; store may keep a local echo for the "submitted" state only. |
| `auth.store` | Holds `UserDTO` only; hydrate via `GET /api/auth/me` on app load (a `useSession` hook), not by trusting persisted localStorage. Keep `logout()` calling the API. |
| `users.store` | **Delete** — server owns users. |
| `account/profile.store` | Replace reads/writes with `useProfile`/`useUpdateProfile`. |
| `account/addresses.store` | Replace with address hooks (server list). |
| `account/wallet.store` | Replace with `useWallet` (flag-gated). |
| `favorites.store` | Guests: keep localStorage. On login: PUT the set (`useFavoritesSync`), then treat server as source of truth. |
| `recently-viewed.store` | **Unchanged** — pure client UX. |

`AuthGuard` keeps working: it already gates on `useHydrated()` + `isAuthenticated`; just ensure the
session is confirmed via `/api/auth/me` before deciding (avoids trusting stale localStorage).

---

## 6. Shared contracts (single source of types)

`src/shared/contracts/*` exports Zod schemas + inferred types used by **both** client and server:

- `product.contract.ts` → `productDtoSchema`, `ProductDTO`, `productListQuerySchema`.
- `order.contract.ts` → `createOrderInputSchema` (composes `checkoutSchema` + items), `OrderDTO`.
- `auth.contract.ts` → re-exports `loginSchema/registerSchema/forgotPasswordSchema`, `userDtoSchema`.
- `promo.contract.ts`, `review.contract.ts`, `account.contract.ts`, `envelope.ts`, `errors.ts`.

This removes duplicated types, keeps `strict`/no-`any`, and means a contract change fails to compile on
both sides.

---

## 7. Definition of "UI unchanged" (acceptance)

- Every page renders the same product cards, prices (still rounded to 5 EGP), categories, sort, search
  results, cart totals, shipping, promo behavior, order confirmation, account tabs.
- No component JSX/markup/class changes except swapping `basePrice`→`price`.
- Loading states use existing `Loader`/skeletons via React Query `isPending`.
- `pnpm build && pnpm typecheck && pnpm lint` all clean (see `07-checklist.md`).
