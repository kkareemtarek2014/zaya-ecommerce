import 'server-only';
import { and, desc, eq, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
import { isFeatureEnabled } from '@/config/features.config';
import type { Db } from '@/server/db/client';
import { orders, payments, shipments } from '@/server/db/schema';
import { markCronJobRun } from '@/server/jobs/config';
import {
  isBostaShippingAvailable,
  tryAutoCreateShipment,
  refreshShipmentForOrder,
  readBostaSecretsPublic,
} from '@/server/services/bosta.service';
import {
  isOnlinePaymentsAvailable,
  readPaymobSecretsPublic,
} from '@/server/services/paymob.service';
import * as ordersRepo from '@/server/repositories/orders.repo';
import {
  recordOrderStatusChange,
} from '@/server/services/order-timeline.service';

const ORDER_SCAN_LIMIT = 80;
const REFRESH_LIMIT = 25;

export type IntegrationIssueKind =
  | 'payment_mismatch'
  | 'missing_shipment'
  | 'status_drift';

export type IntegrationIssue = {
  kind: IntegrationIssueKind;
  orderId: string;
  detail: string;
};

export type IntegrationsStatusDTO = {
  onlinePayments: {
    flag: boolean;
    configured: boolean;
    mock: boolean;
  };
  bostaShipping: {
    flag: boolean;
    configured: boolean;
    mock: boolean;
  };
  issues: {
    paymentMismatch: number;
    missingShipment: number;
    statusDrift: number;
  };
  samples: IntegrationIssue[];
};

/** Scan for order ↔ payment ↔ shipment inconsistencies (report only). */
export async function scanIntegrationIssues(
  db: Db,
  env: CloudflareEnv,
): Promise<{
  issues: IntegrationIssue[];
  paymentMismatch: number;
  missingShipment: number;
  statusDrift: number;
}> {
  const issues: IntegrationIssue[] = [];
  const bostaOn = isBostaShippingAvailable(env);

  // Paid payment row but order.payment_status still pending (missed webhook side-effect)
  const paymentMismatchRows = await db
    .select({
      orderId: orders.id,
      orderPaymentStatus: orders.paymentStatus,
      paymentStatus: payments.status,
      paymentId: payments.id,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, 'paid'),
        ne(orders.paymentStatus, 'paid'),
        inArray(orders.paymentMethod, ['card', 'wallet']),
      ),
    )
    .orderBy(desc(payments.updatedAt))
    .limit(ORDER_SCAN_LIMIT);

  for (const row of paymentMismatchRows) {
    issues.push({
      kind: 'payment_mismatch',
      orderId: row.orderId,
      detail: `payment=${row.paymentStatus} order.paymentStatus=${row.orderPaymentStatus}`,
    });
  }

  let missingShipment = 0;
  if (bostaOn) {
    const ready = await db
      .select({
        id: orders.id,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        status: orders.status,
      })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .where(
        and(
          ne(orders.status, 'cancelled'),
          or(
            eq(orders.paymentMethod, 'cod'),
            and(
              inArray(orders.paymentMethod, ['card', 'wallet']),
              eq(orders.paymentStatus, 'paid'),
            ),
          ),
          sql`${shipments.id} is null`,
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(ORDER_SCAN_LIMIT);

    for (const row of ready) {
      missingShipment += 1;
      issues.push({
        kind: 'missing_shipment',
        orderId: row.id,
        detail: `${row.paymentMethod}/${row.paymentStatus} · ${row.status}`,
      });
    }
  }

  const driftRows = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      mappedStatus: shipments.mappedStatus,
      shipmentId: shipments.id,
    })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .where(
      and(
        isNotNull(shipments.mappedStatus),
        ne(orders.status, 'cancelled'),
        sql`${shipments.mappedStatus} is not null and ${shipments.mappedStatus} != ${orders.status}`,
      ),
    )
    .orderBy(desc(shipments.updatedAt))
    .limit(ORDER_SCAN_LIMIT);

  let statusDrift = 0;
  for (const row of driftRows) {
    if (!row.mappedStatus || row.mappedStatus === row.orderStatus) continue;
    statusDrift += 1;
    issues.push({
      kind: 'status_drift',
      orderId: row.orderId,
      detail: `order=${row.orderStatus} shipment=${row.mappedStatus}`,
    });
  }

  return {
    issues,
    paymentMismatch: paymentMismatchRows.length,
    missingShipment,
    statusDrift,
  };
}

/**
 * Reconcile Paymob/Bosta state vs local (P15). Best-effort fixes + counts.
 */
export async function integrationsReconcileJob(
  db: Db,
  env: CloudflareEnv,
): Promise<Record<string, number | string>> {
  const scan = await scanIntegrationIssues(db, env);
  let paymentFixed = 0;
  let shipmentsCreated = 0;
  let statusSynced = 0;
  let refreshed = 0;
  let errors = 0;

  for (const issue of scan.issues) {
    if (issue.kind !== 'payment_mismatch') continue;
    try {
      const found = await ordersRepo.findOrderById(db, issue.orderId);
      if (!found) continue;
      const prev = found.order.status;
      await ordersRepo.updateOrderPayment(db, issue.orderId, {
        paymentStatus: 'paid',
        status: prev === 'placed' ? 'confirmed' : prev,
      });
      if (prev === 'placed') {
        await recordOrderStatusChange(db, {
          orderId: issue.orderId,
          fromStatus: 'placed',
          toStatus: 'confirmed',
          actor: 'system',
          note: 'Reconcile: synced paid payment → order',
        });
      }
      paymentFixed += 1;
      await tryAutoCreateShipment(issue.orderId, { db, env });
    } catch (err) {
      errors += 1;
      console.error('[reconcile payment]', issue.orderId, err);
    }
  }

  for (const issue of scan.issues) {
    if (issue.kind !== 'missing_shipment') continue;
    try {
      await tryAutoCreateShipment(issue.orderId, { db, env });
      const row = await db
        .select({ id: shipments.id })
        .from(shipments)
        .where(eq(shipments.orderId, issue.orderId))
        .limit(1);
      if (row[0]) shipmentsCreated += 1;
    } catch (err) {
      errors += 1;
      console.error('[reconcile shipment]', issue.orderId, err);
    }
  }

  for (const issue of scan.issues) {
    if (issue.kind !== 'status_drift') continue;
    try {
      await refreshShipmentForOrder(issue.orderId, { db, env });
      statusSynced += 1;
    } catch (err) {
      errors += 1;
      console.error('[reconcile drift]', issue.orderId, err);
    }
  }

  // Refresh a sample of open shipments from Bosta (missed webhooks)
  if (isBostaShippingAvailable(env)) {
    const open = await db
      .select({ orderId: shipments.orderId })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(
        and(
          isNotNull(shipments.bostaDeliveryId),
          ne(orders.status, 'delivered'),
          ne(orders.status, 'cancelled'),
        ),
      )
      .orderBy(desc(shipments.updatedAt))
      .limit(REFRESH_LIMIT);

    for (const row of open) {
      try {
        await refreshShipmentForOrder(row.orderId, { db, env });
        refreshed += 1;
      } catch (err) {
        errors += 1;
        console.error('[reconcile refresh]', row.orderId, err);
      }
    }
  }

  await markCronJobRun(db, 'integrations-reconcile');

  return {
    scanned: scan.issues.length,
    paymentMismatch: scan.paymentMismatch,
    missingShipment: scan.missingShipment,
    statusDrift: scan.statusDrift,
    paymentFixed,
    shipmentsCreated,
    statusSynced,
    refreshed,
    errors,
    onlinePayments: isOnlinePaymentsAvailable(env) ? 1 : 0,
    bosta: isBostaShippingAvailable(env) ? 1 : 0,
  };
}

export async function getIntegrationsStatus(
  db: Db,
  env: CloudflareEnv,
): Promise<IntegrationsStatusDTO> {
  const paymob = readPaymobSecretsPublic(env);
  const bosta = readBostaSecretsPublic(env);
  const scan = await scanIntegrationIssues(db, env);

  return {
    onlinePayments: {
      flag: isFeatureEnabled('online_payments'),
      configured: paymob != null,
      mock: paymob?.mock ?? false,
    },
    bostaShipping: {
      flag: isFeatureEnabled('bosta_shipping'),
      configured: bosta != null,
      mock: bosta?.mock ?? false,
    },
    issues: {
      paymentMismatch: scan.paymentMismatch,
      missingShipment: scan.missingShipment,
      statusDrift: scan.statusDrift,
    },
    samples: scan.issues.slice(0, 20),
  };
}
