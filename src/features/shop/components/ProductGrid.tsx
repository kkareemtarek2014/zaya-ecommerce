'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Product } from '@/shared/types/product.types';
import { Button, ProductGridSkeleton } from '@/shared/components/ui';
import { ProductCard } from './ProductCard';

export type ProductGridEmptyVariant = 'empty-category' | 'no-results';

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading?: boolean;
  emptyVariant?: ProductGridEmptyVariant;
  hasActiveFilters?: boolean;
  filterSummary?: string;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading,
  emptyVariant,
  hasActiveFilters,
  filterSummary,
  onClearFilters,
}: ProductGridProps) {
  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (!products || products.length === 0) {
    if (emptyVariant === 'no-results' || hasActiveFilters) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🫧
          </p>
          <div>
            <p className="font-display text-xl font-semibold text-text-primary">
              No squishies match
            </p>
            {filterSummary ? (
              <p className="mt-1 text-sm text-text-secondary">
                Filters: {filterSummary}
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">
                Try clearing search or theme tags.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onClearFilters ? (
              <Button type="button" variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : null}
            <Link href="/shop">
              <Button type="button">Browse all</Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-4xl" aria-hidden>
          🧸
        </p>
        <p className="font-display text-xl font-semibold text-text-primary">
          Nothing here yet
        </p>
        <p className="max-w-sm text-sm text-text-secondary">
          No squishies in this category yet — check back soon, or browse the
          full shop.
        </p>
        <Link href="/shop" className="mt-2">
          <Button type="button" variant="outline">
            Browse all
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-up stagger"
          style={{ '--stagger-i': Math.min(index, 8) } as CSSProperties}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
