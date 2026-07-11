'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import type { Product } from '@/shared/types/product.types';
import { formatEGP, getSellPrice } from '@/shared/utils/price';
import { Badge, QuantityStepper } from '@/shared/components/ui';
import { useCartStore } from '@/features/cart';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );
  const price = getSellPrice(product.basePrice);
  const isBestSeller = product.tags?.includes('best seller');

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-(--radius-lg) border border-border bg-surface-raised transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/10">
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-square overflow-hidden bg-brand-blush"
      >
        <Image
          src={product.images[0] ?? ''}
          alt={product.name}
          width={480}
          height={480}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isBestSeller && <Badge tone="accent">Best Seller</Badge>}
          {product.compareAtPrice && <Badge tone="error">Sale</Badge>}
          {!product.inStock && <Badge tone="muted">Sold Out</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-brand-primary">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Star className="size-3.5 fill-brand-accent text-brand-accent" />
          <span className="font-medium text-text-secondary">
            {product.rating}
          </span>
          <span>({product.reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-brand-primary">
              {formatEGP(price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-text-muted line-through">
                {formatEGP(product.compareAtPrice)}
              </span>
            )}
          </div>
          {cartItem ? (
            <QuantityStepper
              value={cartItem.quantity}
              min={0}
              onChange={(q) => {
                if (q === 0) {
                  removeItem(product.id);
                } else {
                  setQuantity(product.id, q);
                }
              }}
              className="h-9 [&>span]:w-8 [&>button]:w-8 rounded-full bg-surface"
            />
          ) : (
            <button
              type="button"
              aria-label={`Add ${product.name} to cart`}
              disabled={!product.inStock}
              onClick={() => addItem(product)}
              className="flex size-9 items-center justify-center rounded-full bg-brand-blush text-brand-primary transition-colors hover:bg-brand-primary hover:text-text-inverse disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
