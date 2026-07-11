import { PRODUCTS } from '@/shared/data/products.data';
import { CATEGORIES } from '@/shared/data/categories.data';
import type { Category, Product } from '@/shared/types/product.types';

/**
 * Product catalog service.
 * Currently backed by the dummy data layer (src/shared/data).
 * When the real supplier/backend API exists (see API.md), replace ONLY the
 * bodies of these functions — every component goes through this service.
 */

const simulateLatency = (ms = 150) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getProducts(): Promise<Product[]> {
  await simulateLatency();
  return PRODUCTS;
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  await simulateLatency();
  return PRODUCTS.filter((p) => p.category === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await simulateLatency();
  return PRODUCTS.filter((p) => p.featured);
}

export async function getProductById(id: string): Promise<Product | null> {
  await simulateLatency();
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  await simulateLatency(50);
  return CATEGORIES;
}

export async function getRelatedProducts(
  id: string,
  category: string,
  limit = 4,
): Promise<Product[]> {
  await simulateLatency();
  return PRODUCTS.filter(
    (p) => p.id !== id && p.category === category,
  ).slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  await simulateLatency();
  return [...PRODUCTS].reverse().slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  await simulateLatency(120);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter((p) => {
    const haystack = [p.name, p.category, ...(p.tags ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }).slice(0, 8);
}
