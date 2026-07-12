'use client';

import { useCartRecommendations } from '../hooks/useCartRecommendations';
import { CartRecommendationCard } from './CartRecommendationCard';

interface CartRecommendationsProps {
  /** Section heading. */
  title?: string;
  /** Called when a recommendation link is followed (e.g. close the drawer). */
  onNavigate?: () => void;
}

/**
 * "You may also like" horizontal slider for the cart. CSS scroll-snap only —
 * no carousel library (per project animation rules). Renders nothing when
 * there are no eligible products.
 */
export function CartRecommendations({
  title = 'You may also like',
  onNavigate,
}: CartRecommendationsProps) {
  const { products } = useCartRecommendations();

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {products.map((product) => (
          <CartRecommendationCard
            key={product.id}
            product={product}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}
