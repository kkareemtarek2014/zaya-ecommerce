import { getSellPrice } from '@/shared/utils/price';
import { PROFIT_MARGIN } from '@/config/site.config';
import type { Db } from '@/server/db/client';
import { eq } from 'drizzle-orm';
import { settings } from '@/server/db/schema';

/**
 * Effective profit margin from settings DB, else site.config fallback.
 */
export async function getProfitMargin(db: Db): Promise<number> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'profit_margin'))
    .limit(1);
  const value = rows[0]?.value;
  return typeof value === 'number' && value > 0 ? value : PROFIT_MARGIN;
}

/**
 * Single price authority — sell price from base cost + effective margin.
 */
export function computeSellPrice(basePrice: number, margin: number): number {
  return getSellPrice(basePrice, margin);
}

export async function computeSellPriceFromDb(
  db: Db,
  basePrice: number,
): Promise<number> {
  const margin = await getProfitMargin(db);
  return computeSellPrice(basePrice, margin);
}
