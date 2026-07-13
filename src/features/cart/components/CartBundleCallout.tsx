'use client';

import { useQuery } from '@tanstack/react-query';
import { isFeatureEnabled } from '@/config/features.config';
import { api } from '@/shared/lib/api-client';
import { formatEGP } from '@/shared/utils/price';
import type { BundleEvaluateResult } from '@/shared/contracts/admin-bundles.contract';
import type { CartItem } from '../store/cart.store';

export function CartBundleCallout({ items }: { items: CartItem[] }) {
  const enabled = isFeatureEnabled('bundles');
  const { data } = useQuery({
    queryKey: [
      'cart-bundle-evaluate',
      items.map((i) => `${i.productId}:${i.quantity}`).join('|'),
    ],
    queryFn: () =>
      api.post<BundleEvaluateResult>('/api/bundles/evaluate', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    enabled: enabled && items.length > 0,
  });

  if (!enabled || !data?.discount || data.discount <= 0) return null;

  return (
    <p className="mt-3 rounded-(--radius) bg-brand-blush/70 px-4 py-3 text-xs text-brand-secondary">
      Bundle offer{data.bundleName ? ` · ${data.bundleName}` : ''}: save about{' '}
      <strong>{formatEGP(data.discount)}</strong> at checkout.
    </p>
  );
}
