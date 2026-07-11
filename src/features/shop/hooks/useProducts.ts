'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCategories,
  getFeaturedProducts,
  getProductById,
  getProducts,
  getProductsByCategory,
  getRelatedProducts,
  getNewArrivals,
} from '../services/products.service';

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category ?? 'all'],
    queryFn: () =>
      category ? getProductsByCategory(category) : getProducts(),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: getFeaturedProducts,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

export function useRelatedProducts(
  currentId: string,
  category: string,
  limit = 4,
) {
  return useQuery({
    queryKey: ['products', 'related', currentId, category, limit],
    queryFn: () => getRelatedProducts(currentId, category, limit),
    enabled: Boolean(currentId),
  });
}

export function useNewArrivals(limit = 8) {
  return useQuery({
    queryKey: ['products', 'new', limit],
    queryFn: () => getNewArrivals(limit),
  });
}
