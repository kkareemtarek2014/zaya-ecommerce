import type { ShippingZone } from '@/config/site.config';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATES,
} from '@/config/site.config';

export type ShippingPreviewConfig = {
  freeShippingThreshold: number;
  zoneFees: Record<ShippingZone, number>;
};

const DEFAULT_CONFIG: ShippingPreviewConfig = {
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  zoneFees: { ...SHIPPING_RATES },
};

/**
 * Preview shipping for checkout UI. Authoritative total is always server-side.
 * Pass effective config from `GET /api/storefront-config` when available.
 */
export function getShippingCost(
  zone: ShippingZone | undefined,
  subtotal: number,
  config: ShippingPreviewConfig = DEFAULT_CONFIG,
): number {
  if (subtotal >= config.freeShippingThreshold) return 0;
  if (!zone) return config.zoneFees.far;
  return config.zoneFees[zone];
}

export { DEFAULT_CONFIG as defaultShippingPreviewConfig };

/** Build checkout preview config from public storefront API response. */
export function buildShippingPreviewConfig(
  config?: {
    freeShippingThreshold: number;
    shippingZones: { zone: ShippingZone; fee: number }[];
  } | null,
): ShippingPreviewConfig {
  if (!config) return DEFAULT_CONFIG;
  const zoneFees = { ...SHIPPING_RATES };
  for (const z of config.shippingZones) {
    zoneFees[z.zone] = z.fee;
  }
  return {
    freeShippingThreshold: config.freeShippingThreshold,
    zoneFees,
  };
}
