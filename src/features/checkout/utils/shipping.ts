import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATES,
} from '@/config/site.config';
import { getGovernorate } from '@/shared/data/governorates.data';

/**
 * Shipping cost by governorate:
 *   Cairo & Giza → 50 EGP · nearby governorates → 80 EGP · far → 100 EGP.
 * Orders at/above FREE_SHIPPING_THRESHOLD ship free.
 */
export function getShippingCost(
  governorateId: string,
  subtotal: number,
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const governorate = getGovernorate(governorateId);
  if (!governorate) return SHIPPING_RATES.far;
  return SHIPPING_RATES[governorate.zone];
}
