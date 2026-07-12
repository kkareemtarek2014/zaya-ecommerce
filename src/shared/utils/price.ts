import { PROFIT_MARGIN, SITE } from '@/config/site.config';

/**
 * Selling price = sourcing cost + profit margin, rounded up
 * to the nearest 5 EGP so prices always look clean.
 * `margin` defaults to site.config; server passes effective settings margin.
 */
export function getSellPrice(
  basePrice: number,
  margin: number = PROFIT_MARGIN,
): number {
  const raw = basePrice * (1 + margin);
  return Math.ceil(raw / 5) * 5;
}

/** Format a number as EGP, e.g. 1250 → "EGP 1,250". */
export function formatEGP(amount?: number | null): string {
  if (amount == null || isNaN(amount)) {
    return `${SITE.currency} 0`;
  }
  return `${SITE.currency} ${amount.toLocaleString(SITE.locale)}`;
}
