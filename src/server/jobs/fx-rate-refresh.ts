import 'server-only';
import type { Db } from '@/server/db/client';
import * as fxRepo from '@/server/repositories/fx-rates.repo';
import { setSettingRaw, markCronJobRun } from '@/server/jobs/config';
import { repriceProductsWithUsdBase } from '@/server/services/pricing.service';

async function fetchUsdEgpRate(
  env: CloudflareEnv,
): Promise<{ rate: number; source: string }> {
  const apiKey =
    'FX_API_KEY' in env && typeof (env as { FX_API_KEY?: string }).FX_API_KEY === 'string'
      ? (env as { FX_API_KEY?: string }).FX_API_KEY
      : undefined;

  if (apiKey) {
    // exchangerate-api.com style when FX_API_KEY is set
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/EGP`,
      { headers: { accept: 'application/json' } },
    );
    if (!res.ok) {
      throw new Error(`FX API HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      conversion_rate?: number;
      result?: string;
    };
    if (
      typeof body.conversion_rate !== 'number' ||
      body.conversion_rate <= 0
    ) {
      throw new Error('FX API returned invalid rate');
    }
    return { rate: body.conversion_rate, source: 'exchangerate-api' };
  }

  // Free fallback — no key required
  const res = await fetch(
    'https://api.frankfurter.app/latest?from=USD&to=EGP',
    { headers: { accept: 'application/json' } },
  );
  if (!res.ok) {
    throw new Error(`Frankfurter HTTP ${res.status}`);
  }
  const body = (await res.json()) as { rates?: { EGP?: number } };
  const rate = body.rates?.EGP;
  if (typeof rate !== 'number' || rate <= 0) {
    throw new Error('Frankfurter returned invalid EGP rate');
  }
  return { rate, source: 'frankfurter' };
}

/**
 * Fetch live USD→EGP, persist history + settings, then reprice USD-based products.
 */
export async function fxRateRefreshJob(
  db: Db,
  env: CloudflareEnv,
): Promise<Record<string, number | string>> {
  const { rate, source } = await fetchUsdEgpRate(env);
  const rounded = Math.round(rate * 10_000) / 10_000;
  const fetchedAt = new Date();

  await fxRepo.insertFxRate(db, {
    id: `fx_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    rate: rounded,
    source,
    fetchedAt,
  });
  await setSettingRaw(db, 'usd_egp_rate', rounded);

  const { updated } = await repriceProductsWithUsdBase(db);
  await markCronJobRun(db, 'fx-rate-refresh', fetchedAt);

  return {
    rate: rounded,
    source,
    repriced: updated,
  };
}

/** Recompute landed_cost for all products with base_price_usd. */
export async function landedCostRepriceJob(
  db: Db,
): Promise<Record<string, number | string>> {
  const { updated } = await repriceProductsWithUsdBase(db);
  await markCronJobRun(db, 'landed-cost-reprice');
  return { updated };
}
