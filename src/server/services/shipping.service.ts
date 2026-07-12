import { eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { shippingZones } from '@/server/db/schema';
import { governorates } from '@/server/db/schema';
import { settings } from '@/server/db/schema';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATES,
  type ShippingZone,
} from '@/config/site.config';

export async function getFreeShippingThreshold(db: Db): Promise<number> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'free_shipping_threshold'))
    .limit(1);
  const value = rows[0]?.value;
  return typeof value === 'number' ? value : FREE_SHIPPING_THRESHOLD;
}

export async function getZoneFee(db: Db, zone: ShippingZone): Promise<number> {
  const rows = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.zone, zone))
    .limit(1);
  return rows[0]?.fee ?? SHIPPING_RATES[zone];
}

/**
 * Shipping cost by governorate.
 * Free shipping uses subtotal **before** discount (matches storefront cart UX).
 */
export async function getShippingCost(
  db: Db,
  governorateId: string,
  subtotal: number,
): Promise<number> {
  const threshold = await getFreeShippingThreshold(db);
  if (subtotal >= threshold) return 0;

  const govRows = await db
    .select()
    .from(governorates)
    .where(eq(governorates.id, governorateId))
    .limit(1);
  const zone = (govRows[0]?.zone ?? 'far') as ShippingZone;
  return getZoneFee(db, zone);
}
