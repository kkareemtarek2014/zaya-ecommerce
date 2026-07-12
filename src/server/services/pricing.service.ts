import { getSellPrice } from '@/shared/utils/price';

/**
 * Single price authority for storefront DTOs.
 * Later phases may swap this for landed-cost / settings-driven pricing.
 */
export function computeSellPrice(basePrice: number): number {
  return getSellPrice(basePrice);
}
