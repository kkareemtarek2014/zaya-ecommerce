'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useProducts, ProductGrid } from '@/features/shop';
import { useFavoritesStore } from '../store/favorites.store';

export function FavoritesGrid() {
  const mounted = useHydrated();
  const ids = useFavoritesStore((s) => s.ids);
  const { data: products, isLoading } = useProducts();

  if (!mounted) return null;

  const favorites = products?.filter((p) => ids.includes(p.id));

  if (!isLoading && (!favorites || favorites.length === 0)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Heart className="size-12 text-border-strong" />
        <p className="text-sm text-text-secondary">
          No favorites yet — tap the heart on any product to save it here.
        </p>
        <Link href="/shop">
          <Button variant="outline">Browse products</Button>
        </Link>
      </div>
    );
  }

  return <ProductGrid products={favorites} isLoading={isLoading} />;
}
