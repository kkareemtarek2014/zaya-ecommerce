'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Product } from '@/shared/types/product.types';
import { formatEGP } from '@/shared/utils/price';
import { Badge, QuantityStepper, WishlistButton } from '@/shared/components/ui';
import { useCartStore } from '@/features/cart';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );

  const price = product.price;
  const isBestSeller = product.tags?.includes('best seller');
  const onSale = Boolean(
    product.compareAtPrice && product.compareAtPrice > price,
  );
  const savePct = onSale
    ? Math.round(
        ((product.compareAtPrice! - price) / product.compareAtPrice!) * 100,
      )
    : 0;
  const hoverImage = product.images[1];

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface-raised transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-brand-primary/10">
      <div className="relative aspect-square overflow-hidden bg-brand-blush">
        <Link
          href={`/product/${product.id}`}
          aria-label={product.name}
          className="block size-full"
        >
          <Image
            src={product.images[0] ?? ''}
            alt={product.name}
            width={480}
            height={480}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              width={480}
              height={480}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="absolute inset-0 size-full scale-105 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {isBestSeller && <Badge tone="accent">Best Seller</Badge>}
          {onSale && <Badge tone="error">Save {savePct}%</Badge>}
          {!product.inStock && <Badge tone="muted">Sold Out</Badge>}
        </div>

        {/* Wishlist */}
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} productName={product.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-brand-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {onSale && (
              <span className="text-xs text-text-muted line-through">
                {formatEGP(product.compareAtPrice!)}
              </span>
            )}
            <span className="font-display text-lg font-semibold text-brand-primary">
              {formatEGP(price)}
            </span>
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
              className="h-9 rounded-full bg-surface [&>button]:w-8 [&>span]:w-8"
            />
          ) : (
            <button
              type="button"
              aria-label={`Add ${product.name} to bag`}
              disabled={!product.inStock}
              onClick={() => addItem(product)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blush text-brand-primary transition-all hover:bg-brand-primary hover:text-text-inverse disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
