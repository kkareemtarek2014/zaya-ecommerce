import { PROFIT_MARGIN, SITE } from '@/config/site.config';

/**
 * Selling price = sourcing cost + profit margin, rounded up
 * to the nearest 5 EGP so prices always look clean.
 */
export function getSellPrice(basePrice: number): number {
  const raw = basePrice * (1 + PROFIT_MARGIN);
  return Math.ceil(raw / 5) * 5;
}

/** Format a number as EGP, e.g. 1250 → "EGP 1,250". */
export function formatEGP(amount?: number | null): string {
  if (amount == null || isNaN(amount)) {
    return `${SITE.currency} 0`;
  }
  return `${SITE.currency} ${amount.toLocaleString(SITE.locale)}`;
}
