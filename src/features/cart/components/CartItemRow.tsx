'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { QuantityStepper } from '@/shared/components/ui';
import { useCartStore, type CartItem } from '../store/cart.store';

export function CartItemRow({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-b-0">
      <Link
        href={`/product/${item.productId}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush"
      >
        <Image
          src={item.image}
          alt={item.name}
          width={192}
          height={192}
          className="size-full object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/product/${item.productId}`}
            className="line-clamp-2 text-sm font-medium hover:text-brand-primary"
          >
            {item.name}
          </Link>
          <button
            type="button"
            aria-label={`Remove ${item.name} from cart`}
            onClick={() => removeItem(item.productId)}
            className="text-text-muted transition-colors hover:text-status-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => setQuantity(item.productId, q)}
            className="h-9"
          />
          <span className="font-semibold text-brand-primary">
            {formatEGP(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
