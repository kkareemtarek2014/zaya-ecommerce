/**
 * Sqoosh — single place to tune business rules.
 * Change a value here and the whole storefront follows.
 */
export const SITE = {
  name: 'Sqoosh',
  tagline: 'Squeeze the stress away.',
  description:
    'Shop squishy stress toys online in Egypt — small, medium & jumbo slow-rising squishies for everyday calm. Cash on delivery & fast shipping.',
  /** Production domain — UPDATE when you buy the real domain (sqoosh-eg.com). */
  url: 'https://sqoosh-eg.com',
  currency: 'EGP',
  locale: 'en-EG',
  keywords: [
    'squishy toys Egypt',
    'stress toys Egypt',
    'slow rising squishy',
    'fidget toys Egypt',
    'سكويشي',
    'سكويشي مصر',
    'العاب ضغط',
    'فيدجت',
    'سكوش',
    'cash on delivery Egypt',
    'Sqoosh',
  ],
} as const;

/**
 * Profit margin applied on top of the landed sourcing cost.
 * Business rule: 60% (allowed range 40–80%). See BUSINESS-PLAN.md §2b.
 */
export const PROFIT_MARGIN = 0.6;

/** Delivery zones used across shipping + governorate data. */
export type ShippingZone = 'cairo_giza' | 'near' | 'far';

/** Shipping cost per delivery zone, in EGP. */
export const SHIPPING_RATES: Record<ShippingZone, number> = {
  cairo_giza: 50,
  near: 80,
  far: 100,
};

/** Orders at or above this subtotal (EGP) ship for free. */
export const FREE_SHIPPING_THRESHOLD = 500;

/**
 * Extra loyalty discount for signed-in customers, as a percentage of subtotal.
 * Guests can still check out; logging in unlocks this on top of any promo/bundle.
 * Applied in the checkout preview AND enforced server-side on order placement.
 * See BUSINESS-PLAN.md (retention) — keep client + server in sync via the helper.
 */
export const MEMBER_DISCOUNT_PERCENT = 5;

/** Member loyalty discount in EGP for a given subtotal (rounded to whole EGP). */
export function computeMemberDiscount(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100);
}
