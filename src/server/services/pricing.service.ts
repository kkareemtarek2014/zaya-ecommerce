import 'server-only';
import { eq, isNotNull } from 'drizzle-orm';
import { getSellPrice } from '@/shared/utils/price';
import { PROFIT_MARGIN } from '@/config/site.config';
import { isFeatureEnabled } from '@/config/features.config';
import type { Db } from '@/server/db/client';
import { products, settings } from '@/server/db/schema';

/** Placeholder defaults — verify against real FX / customs before go-live (`11` §1.1). */
export const DEFAULT_USD_EGP_RATE = 50;
export const DEFAULT_BULK_SHIPPING_USD = 2;
export const DEFAULT_CUSTOMS_DUTY_RATE = 0.105;
export const DEFAULT_VAT_RATE = 0.14;
export const DEFAULT_HANDLING_FEE_EGP = 100;
export const DEFAULT_TARGET_MARGIN = 0.5;
export const DEFAULT_PRICE_ROUNDING_EGP = 5;

export type PricingProductInput = {
  basePrice: number;
  basePriceUsd?: number | null;
  landedCost?: number | null;
};

export type PricingSettings = {
  dynamicPricing: boolean;
  profitMargin: number;
  usdEgpRate: number;
  bulkShippingUsd: number;
  customsDutyRate: number;
  vatRate: number;
  handlingFeeEgp: number;
  targetMargin: number;
  priceRoundingEgp: number;
};

async function getSettingNumber(
  db: Db,
  key: string,
): Promise<number | undefined> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  const value = rows[0]?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Effective profit margin from settings DB, else site.config fallback (flat model).
 */
export async function getProfitMargin(db: Db): Promise<number> {
  const value = await getSettingNumber(db, 'profit_margin');
  return value != null && value > 0 ? value : PROFIT_MARGIN;
}

export async function getPricingSettings(db: Db): Promise<PricingSettings> {
  const [
    profitMargin,
    usdEgpRate,
    bulkShippingUsd,
    customsDutyRate,
    vatRate,
    handlingFeeEgp,
    targetMargin,
    priceRoundingEgp,
  ] = await Promise.all([
    getProfitMargin(db),
    getSettingNumber(db, 'usd_egp_rate'),
    getSettingNumber(db, 'bulk_shipping_usd'),
    getSettingNumber(db, 'customs_duty_rate'),
    getSettingNumber(db, 'vat_rate'),
    getSettingNumber(db, 'handling_fee_egp'),
    getSettingNumber(db, 'target_margin'),
    getSettingNumber(db, 'price_rounding_egp'),
  ]);

  return {
    dynamicPricing: isFeatureEnabled('dynamic_pricing'),
    profitMargin,
    usdEgpRate: usdEgpRate != null && usdEgpRate > 0 ? usdEgpRate : DEFAULT_USD_EGP_RATE,
    bulkShippingUsd:
      bulkShippingUsd != null && bulkShippingUsd >= 0
        ? bulkShippingUsd
        : DEFAULT_BULK_SHIPPING_USD,
    customsDutyRate:
      customsDutyRate != null && customsDutyRate >= 0
        ? customsDutyRate
        : DEFAULT_CUSTOMS_DUTY_RATE,
    vatRate: vatRate != null && vatRate >= 0 ? vatRate : DEFAULT_VAT_RATE,
    handlingFeeEgp:
      handlingFeeEgp != null && handlingFeeEgp >= 0
        ? Math.round(handlingFeeEgp)
        : DEFAULT_HANDLING_FEE_EGP,
    targetMargin:
      targetMargin != null && targetMargin >= 0
        ? targetMargin
        : DEFAULT_TARGET_MARGIN,
    priceRoundingEgp:
      priceRoundingEgp != null && priceRoundingEgp >= 1
        ? Math.round(priceRoundingEgp)
        : DEFAULT_PRICE_ROUNDING_EGP,
  };
}

/** Landed cost in EGP from USD base + settings (`11` §1.2). Rounded to nearest EGP. */
export function computeLandedCost(
  basePriceUsd: number,
  settings: Pick<
    PricingSettings,
    | 'usdEgpRate'
    | 'bulkShippingUsd'
    | 'customsDutyRate'
    | 'vatRate'
    | 'handlingFeeEgp'
  >,
): number {
  const itemEGP = basePriceUsd * settings.usdEgpRate;
  const shippingEGP = settings.bulkShippingUsd * settings.usdEgpRate;
  const cifEGP = itemEGP + shippingEGP;
  const customsEGP = cifEGP * settings.customsDutyRate;
  const vatEGP = (cifEGP + customsEGP) * settings.vatRate;
  const landed =
    cifEGP + customsEGP + vatEGP + settings.handlingFeeEgp;
  return Math.max(0, Math.round(landed));
}

function roundUpTo(amount: number, step: number): number {
  if (step <= 1) return Math.ceil(amount);
  return Math.ceil(amount / step) * step;
}

/**
 * Single price authority — sell price from product + pricing settings.
 * Dynamic path only when flag ON and `basePriceUsd` is set; else flat EGP model.
 */
export function computeSellPrice(
  product: PricingProductInput,
  settings: PricingSettings,
): number {
  if (
    settings.dynamicPricing &&
    product.basePriceUsd != null &&
    product.basePriceUsd > 0
  ) {
    const landed =
      product.landedCost != null && product.landedCost > 0
        ? product.landedCost
        : computeLandedCost(product.basePriceUsd, settings);
    const raw = landed * (1 + settings.targetMargin);
    return roundUpTo(raw, settings.priceRoundingEgp);
  }
  return getSellPrice(product.basePrice, settings.profitMargin);
}

/** @deprecated Prefer `computeSellPrice(product, settings)` — kept for thin wrappers. */
export function computeSellPriceFlat(
  basePrice: number,
  margin: number,
): number {
  return getSellPrice(basePrice, margin);
}

export async function computeSellPriceFromDb(
  db: Db,
  product: PricingProductInput,
): Promise<number> {
  const settings = await getPricingSettings(db);
  return computeSellPrice(product, settings);
}

/** Recompute + persist `landed_cost` for all products with a USD base. */
export async function repriceProductsWithUsdBase(
  db: Db,
): Promise<{ updated: number }> {
  const pricing = await getPricingSettings(db);
  const rows = await db
    .select({
      id: products.id,
      basePriceUsd: products.basePriceUsd,
    })
    .from(products)
    .where(isNotNull(products.basePriceUsd));

  let updated = 0;
  for (const row of rows) {
    if (row.basePriceUsd == null || row.basePriceUsd <= 0) continue;
    const landedCost = computeLandedCost(row.basePriceUsd, pricing);
    await db
      .update(products)
      .set({ landedCost })
      .where(eq(products.id, row.id));
    updated += 1;
  }
  return { updated };
}

export function pricingInputFromRow(row: {
  basePrice: number;
  basePriceUsd?: number | null;
  landedCost?: number | null;
}): PricingProductInput {
  return {
    basePrice: row.basePrice,
    basePriceUsd: row.basePriceUsd,
    landedCost: row.landedCost,
  };
}
