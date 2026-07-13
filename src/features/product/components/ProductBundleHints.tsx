'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { isFeatureEnabled } from '@/config/features.config';
import { api } from '@/shared/lib/api-client';

type BundleHint = {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  productIds: string[];
};

export function ProductBundleHints({ productId }: { productId: string }) {
  const enabled = isFeatureEnabled('bundles');
  const { data: hints = [] } = useQuery({
    queryKey: ['product-bundles', productId],
    queryFn: () =>
      api.get<BundleHint[]>(
        `/api/products/${encodeURIComponent(productId)}/bundles`,
      ),
    enabled,
  });

  if (!enabled || hints.length === 0) return null;

  return (
    <div className="rounded-(--radius) border border-border bg-surface px-4 py-3 text-sm">
      <p className="font-medium text-text-primary">Frequently bought together</p>
      <ul className="mt-2 space-y-1 text-text-secondary">
        {hints.map((h) => (
          <li key={h.id}>
            {h.name}
            {h.type === 'bxgy'
              ? ` — buy ${String(h.config.buyQty)} get ${String(h.config.getQty)}`
              : ''}
            {h.productIds
              .filter((id) => id !== productId)
              .slice(0, 2)
              .map((id) => (
                <span key={id}>
                  {' · '}
                  <Link
                    href={`/product/${id}`}
                    className="text-brand-primary underline-offset-2 hover:underline"
                  >
                    View pair
                  </Link>
                </span>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
