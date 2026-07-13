import 'server-only';
import type { ValidatePromoResult } from '@/shared/contracts/promo.contract';
import { getRequestDb } from '@/server/db/request';
import * as promosRepo from '@/server/repositories/promos.repo';
import * as redemptionsRepo from '@/server/repositories/promo-redemptions.repo';

/**
 * Authoritative promo validation — mirrors former validatePromoCode().
 * Discount is rounded to integer EGP.
 */
export async function validatePromo(
  code: string,
  subtotal: number,
): Promise<ValidatePromoResult> {
  const db = await getRequestDb();
  const promo = await promosRepo.findActivePromoByCode(db, code);

  if (!promo) {
    return { valid: false, error: 'Invalid promo code' };
  }

  if (promo.minOrderValue != null && subtotal < promo.minOrderValue) {
    return {
      valid: false,
      error: `Minimum order value for this code is ${promo.minOrderValue} EGP`,
    };
  }

  if (promo.maxRedemptions != null) {
    const used = await redemptionsRepo.countRedemptionsByCode(db, promo.code);
    if (used >= promo.maxRedemptions) {
      return { valid: false, error: 'This promo code has reached its limit' };
    }
  }

  let discountAmount = 0;
  if (promo.type === 'percentage') {
    discountAmount = subtotal * promo.value;
  } else {
    discountAmount = promo.value;
  }

  return {
    valid: true,
    discount: Math.round(discountAmount),
  };
}
