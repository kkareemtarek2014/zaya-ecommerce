import 'server-only';
import { and, eq, isNotNull } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { products } from '@/server/db/schema';
import {
  getSettingRaw,
  markCronJobRun,
  setSettingRaw,
} from '@/server/jobs/config';
import * as inventoryRepo from '@/server/repositories/inventory.repo';
import { createNotification } from '@/server/services/notifications.service';
import { fetchSourceStockStatus } from '@/server/services/temu-scraper.provider';

const DEFAULT_BATCH = 20;

async function getBatchSize(db: Db): Promise<number> {
  const raw = await getSettingRaw(db, 'temu_stock_sync_batch');
  return typeof raw === 'number' && raw > 0 && raw <= 100
    ? Math.floor(raw)
    : DEFAULT_BATCH;
}

/**
 * For Temu-linked products: if source is OOS, zero local stock.
 * Never auto-inflates stock when source returns — that stays manual.
 */
export async function temuStockSyncJob(
  db: Db,
  env: CloudflareEnv,
): Promise<Record<string, number | string>> {
  const enabledRaw = await getSettingRaw(db, 'temu_scraper_enabled');
  if (enabledRaw === false) {
    await markCronJobRun(db, 'temu-stock-sync');
    return { skipped: 1, reason: 'scraper_disabled' };
  }

  const batch = await getBatchSize(db);
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sourceUrl: products.sourceUrl,
      stockQty: products.stockQty,
      sourceInStock: products.sourceInStock,
    })
    .from(products)
    .where(
      and(
        eq(products.sourceProvider, 'temu'),
        isNotNull(products.sourceUrl),
      ),
    )
    .limit(batch);

  let checked = 0;
  let markedOos = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.sourceUrl) continue;
    checked += 1;
    try {
      const { inStock } = await fetchSourceStockStatus(env, row.sourceUrl);
      const now = new Date();

      if (!inStock) {
        if (row.stockQty > 0 || row.sourceInStock !== false) {
          const oldQty = row.stockQty;
          await db
            .update(products)
            .set({
              stockQty: 0,
              inStock: false,
              sourceInStock: false,
              lastSyncedAt: now,
            })
            .where(eq(products.id, row.id));

          if (oldQty > 0) {
            await inventoryRepo.insertMovement(db, {
              id: `im_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
              productId: row.id,
              oldQty,
              newQty: 0,
              delta: -oldQty,
              reason: 'sync',
              orderId: null,
              actorId: null,
              note: 'Temu source out of stock',
              createdAt: now,
            });
          }

          await createNotification(db, {
            type: 'low_stock',
            title: 'Source out of stock',
            body: `${row.name} is OOS at Temu — local stock set to 0`,
            entity: 'product',
            entityId: row.id,
            dedupe: true,
          });
          markedOos += 1;
        } else {
          await db
            .update(products)
            .set({
              sourceInStock: false,
              lastSyncedAt: now,
            })
            .where(eq(products.id, row.id));
        }
      } else {
        // Source in stock — update flag only; do not auto-restock
        await db
          .update(products)
          .set({
            sourceInStock: true,
            lastSyncedAt: now,
          })
          .where(eq(products.id, row.id));
      }
    } catch (err) {
      errors += 1;
      console.error(`[temu-stock-sync] ${row.id}`, err);
    }
  }

  await setSettingRaw(db, 'temu_stock_sync_last_detail', {
    checked,
    markedOos,
    errors,
    at: new Date().toISOString(),
  });
  await markCronJobRun(db, 'temu-stock-sync');

  return { checked, markedOos, errors, batch };
}
