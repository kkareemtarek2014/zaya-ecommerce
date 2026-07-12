'use client';

import { useMemo } from 'react';
import type { Product } from '@/shared/types/product.types';
import { useFeaturedProducts, useNewArrivals } from '@/features/shop';
import { useCartStore } from '../store/cart.store';

/**
 * Products to suggest inside the cart. Sourced from featured products (falls
 * back to new arrivals), filtered to in-stock items that are NOT already in
 * the cart. Front-end only — swap the source hooks when a real
 * recommendations endpoint exists.
 */
export function useCartRecommendations(limit = 8): {
  products: Product[];
  isLoading: boolean;
} {
  const featured = useFeaturedProducts();
  const newArrivals = useNewArrivals(limit + 4);
  const cartItems = useCartStore((s) => s.items);

  const featuredData = featured.data;
  const newArrivalsData = newArrivals.data;

  const products = useMemo(() => {
    const source =
      featuredData && featuredData.length > 0
        ? featuredData
        : (newArrivalsData ?? []);
    const inCart = new Set(cartItems.map((i) => i.productId));
    return source
      .filter((p) => p.inStock && !inCart.has(p.id))
      .slice(0, limit);
  }, [featuredData, newArrivalsData, cartItems, limit]);

  return {
    products,
    isLoading: featured.isLoading && newArrivals.isLoading,
  };
}
