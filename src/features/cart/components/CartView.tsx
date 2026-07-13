'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { useStorefrontConfig } from '@/features/admin';
import { Button } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import {
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
  useCartStore,
} from '../store/cart.store';
import { CartItemRow } from './CartItemRow';
import { OrderNote } from './OrderNote';
import { CartBundleCallout } from './CartBundleCallout';

export function CartView() {
  // Avoid hydration mismatch: the persisted cart only exists on the client.
  const mounted = useHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const discount = useCartStore(selectCartDiscount);
  const total = useCartStore(selectCartTotal);
  const { data: storefrontConfig } = useStorefrontConfig();
  const freeShippingThreshold =
    storefrontConfig?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="size-12 text-border-strong" />
        <p className="text-lg text-text-secondary">Your bag is empty.</p>
        <Link href="/shop">
          <Button variant="outline">Start shopping</Button>
        </Link>
      </div>
    );
  }

  const discountedSubtotal = subtotal - discount;
  const remainingForFree = freeShippingThreshold - discountedSubtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </div>
        <div className="pt-4 border-t border-border">
          <OrderNote />
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface-raised p-6">
        <h2 className="font-display text-xl font-semibold">
          Order Summary
        </h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Subtotal</dt>
            <dd className="font-medium">{formatEGP(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-status-success">
              <dt>Discount</dt>
              <dd>-{formatEGP(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-text-secondary">Shipping</dt>
            <dd className="text-text-muted">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-brand-primary">{formatEGP(total)}</dd>
          </div>
        </dl>

        {remainingForFree > 0 ? (
          <p className="mt-4 rounded-(--radius) bg-brand-blush px-4 py-3 text-xs text-brand-secondary">
            Add {formatEGP(remainingForFree)} more to get{' '}
            <strong>free shipping</strong>.
          </p>
        ) : (
          <p className="mt-4 rounded-(--radius) bg-status-success/10 px-4 py-3 text-xs text-status-success">
            You’ve unlocked <strong>free shipping</strong>!
          </p>
        )}

        <CartBundleCallout items={items} />

        <Link href="/checkout" className="mt-5 block">
          <Button fullWidth size="lg">
            Proceed to checkout
          </Button>
        </Link>
      </aside>
    </div>
  );
}
