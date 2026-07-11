'use client';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useRecentlyViewedStore } from '../store/recently-viewed.store';
import { ProductGrid } from '@/features/shop/components/ProductGrid';

export function RecentlyViewed({ currentId }: { currentId: string }) {
  const isHydrated = useHydrated();
  const viewedProducts = useRecentlyViewedStore((state) => state.viewedProducts);
  
  if (!isHydrated) return null;

  // Don't show the current product in recently viewed
  const filteredProducts = viewedProducts.filter(p => p.id !== currentId).slice(0, 4);

  if (filteredProducts.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-12">
      <h2 className="mb-8 font-(family-name:--font-display) text-2xl font-semibold text-brand-primary">Recently Viewed</h2>
      <ProductGrid products={filteredProducts} />
    </section>
  );
}
