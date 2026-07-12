import { api } from '@/shared/lib/api-client';
import type { Category, Product } from '@/shared/types/product.types';

/**
 * Product catalog service.
 * Bodies call the Cloudflare API; signatures stay stable for hooks/components.
 */

export const getProducts = () => api.get<Product[]>('/api/products');

export const getProductsByCategory = (slug: string) =>
  api.get<Product[]>(`/api/products?category=${encodeURIComponent(slug)}`);

export const getFeaturedProducts = () =>
  api.get<Product[]>('/api/products?featured=true');

export const getProductById = (id: string) =>
  api.get<Product>(`/api/products/${encodeURIComponent(id)}`).catch(() => null);

export const getCategories = () => api.get<Category[]>('/api/categories');

export const getRelatedProducts = (id: string, _category: string, limit = 4) =>
  api.get<Product[]>(
    `/api/products/${encodeURIComponent(id)}/related?limit=${limit}`,
  );

export const getNewArrivals = (limit = 8) =>
  api.get<Product[]>(`/api/products/new?limit=${limit}`);

export const searchProducts = (query: string) =>
  query.trim()
    ? api.get<Product[]>(
        `/api/products/search?q=${encodeURIComponent(query)}`,
      )
    : Promise.resolve([]);
