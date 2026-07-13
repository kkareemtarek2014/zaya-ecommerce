import { and, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { webhookEvents } from '@/server/db/schema';

export type WebhookProvider = 'paymob' | 'bosta';
export type WebhookEventRow = typeof webhookEvents.$inferSelect;

function newId(): string {
  return `wh_${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * Try to claim an event. Returns `true` if this is the first claim (process it).
 * Returns `false` if the event was already recorded (skip as duplicate).
 */
export async function tryClaimWebhookEvent(
  db: Db,
  input: {
    provider: WebhookProvider;
    eventId: string;
    orderId?: string | null;
  },
): Promise<boolean> {
  const eventId = input.eventId.trim();
  if (!eventId) return true;

  try {
    await db.insert(webhookEvents).values({
      id: newId(),
      provider: input.provider,
      eventId,
      orderId: input.orderId ?? null,
      receivedAt: new Date(),
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/UNIQUE|unique|constraint/i.test(msg)) {
      return false;
    }
    throw err;
  }
}

export async function findWebhookEvent(
  db: Db,
  provider: WebhookProvider,
  eventId: string,
): Promise<WebhookEventRow | null> {
  const rows = await db
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.provider, provider),
        eq(webhookEvents.eventId, eventId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
