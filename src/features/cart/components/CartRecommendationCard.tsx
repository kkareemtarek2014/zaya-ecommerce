'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Product } from '@/shared/types/product.types';
import { formatEGP, getSellPrice } from '@/shared/utils/price';
import { useCartStore } from '../store/cart.store';

interface CartRecommendationCardProps {
  product: Product;
  onNavigate?: () => void;
}

/** Compact product card used inside the cart recommendations slider. */
export function CartRecommendationCard({
  product,
  onNavigate,
}: CartRecommendationCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const price = getSellPrice(product.basePrice);

  return (
    <div className="flex w-36 shrink-0 snap-start flex-col">
      <Link
        href={`/product/${product.id}`}
        onClick={onNavigate}
        className="relative aspect-square overflow-hidden rounded-(--radius) bg-brand-blush"
      >
        <Image
          src={product.images[0] ?? ''}
          alt={product.name}
          width={200}
          height={200}
          sizes="144px"
          className="size-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </Link>
      <Link
        href={`/product/${product.id}`}
        onClick={onNavigate}
        className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-text-primary transition-colors hover:text-brand-primary"
      >
        {product.name}
      </Link>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-sm font-semibold text-brand-primary">
          {formatEGP(price)}
        </span>
        <button
          type="button"
          aria-label={`Add ${product.name} to bag`}
          onClick={() => addItem(product)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blush text-brand-primary transition-colors hover:bg-brand-primary hover:text-text-inverse"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
