'use client';

import { useFeaturedProducts } from '../hooks/useProducts';
import { ProductGrid } from './ProductGrid';

export function FeaturedProducts() {
  const { data, isLoading } = useFeaturedProducts();
  return <ProductGrid products={data} isLoading={isLoading} />;
}
