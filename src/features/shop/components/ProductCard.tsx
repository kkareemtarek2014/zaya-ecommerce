'use client';

import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import type { Product } from '@/shared/types/product.types';
import { formatEGP } from '@/shared/utils/price';
import { Badge, QuantityStepper, WishlistButton } from '@/shared/components/ui';
import { useCartStore } from '@/features/cart';

function ProductCardComponent({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1000);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

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
  const canAdd = product.inStock || Boolean(product.preorderAvailable);
  const hoverImage = product.images[1];

  function handleAdd() {
    addItem(product);
    setJustAdded(true);
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface-raised transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-brand-primary/10 active:scale-[0.97]">
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
          {hoverImage ? (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              width={480}
              height={480}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="absolute inset-0 size-full scale-105 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {isBestSeller ? <Badge tone="accent">Best Seller</Badge> : null}
          {onSale ? <Badge tone="error">Save {savePct}%</Badge> : null}
          {!product.inStock && product.preorderAvailable ? (
            <Badge tone="accent">Pre-order</Badge>
          ) : null}
          {!product.inStock && !product.preorderAvailable ? (
            <Badge tone="muted">Sold Out</Badge>
          ) : null}
        </div>

        <div className="absolute top-3 right-3">
          <WishlistButton productId={product.id} productName={product.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-1 text-sm leading-snug font-medium transition-colors group-hover:text-brand-primary sm:line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-2 pt-1">
          <div className="flex flex-col">
            {onSale ? (
              <span className="text-xs text-text-muted line-through">
                {formatEGP(product.compareAtPrice!)}
              </span>
            ) : null}
            <span className="font-display text-lg font-semibold whitespace-nowrap text-brand-primary">
              {formatEGP(price)}
            </span>
          </div>

          {justAdded ? (
            <span
              className="animate-pop inline-flex h-9 items-center gap-1 rounded-full bg-brand-primary px-3 text-xs font-semibold text-text-inverse"
              role="status"
            >
              <Check className="size-3.5" aria-hidden />
              Added
            </span>
          ) : cartItem ? (
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
              className="h-9 rounded-full bg-surface [&>button]:w-9 [&>span]:w-7 [&_svg]:size-3.5"
            />
          ) : (
            <button
              type="button"
              aria-label={`Add ${product.name} to bag`}
              disabled={!canAdd}
              onClick={handleAdd}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blush text-brand-primary transition-all hover:bg-brand-primary hover:text-text-inverse active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Memoized so shop filter/sort keystrokes don’t re-render every card. */
export const ProductCard = memo(ProductCardComponent);
