import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { isFeatureEnabled } from '@/config/features.config';
import { SITE } from '@/config/site.config';
import type { OrderStatus } from '@/shared/contracts/order.contract';
import type { ShipmentDTO } from '@/shared/contracts/shipment.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import { getCloudflareEnv, getRequestDb } from '@/server/db/request';
import type { Db } from '@/server/db/client';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as ordersRepo from '@/server/repositories/orders.repo';
import * as govRepo from '@/server/repositories/governorates.repo';
import * as shipmentsRepo from '@/server/repositories/shipments.repo';
import * as webhookEventsRepo from '@/server/repositories/webhook-events.repo';
import {
  recordOrderStatusChange,
} from '@/server/services/order-timeline.service';
import { commitSaleForOrder } from '@/server/services/inventory.service';
import { fetchWithRetry } from '@/server/lib/retry';

const BOSTA_BASE = 'https://app.bosta.co/api/v2';
const BOSTA_TRACK_URL = 'https://bosta.co/en-eg/tracking-shipments';

type BostaSecrets = {
  apiKey: string;
  webhookSecret: string;
  businessId: string | null;
  mock: boolean;
};

function readBostaSecrets(env: CloudflareEnv): BostaSecrets | null {
  const apiKey = env.BOSTA_API_KEY?.trim();
  if (!apiKey) return null;
  const mock = apiKey === 'mock';
  return {
    apiKey,
    webhookSecret: env.BOSTA_WEBHOOK_SECRET?.trim() || (mock ? 'mock' : ''),
    businessId: env.BOSTA_BUSINESS_ID?.trim() || null,
    mock,
  };
}

/** P15 health — never exposes secret values. */
export function readBostaSecretsPublic(
  env: CloudflareEnv,
): { mock: boolean } | null {
  const secrets = readBostaSecrets(env);
  if (!secrets) return null;
  return { mock: secrets.mock };
}

function secretsEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function isBostaShippingAvailable(env: CloudflareEnv): boolean {
  return isFeatureEnabled('bosta_shipping') && readBostaSecrets(env) != null;
}

export async function getBostaShippingAvailability(): Promise<boolean> {
  const env = await getCloudflareEnv();
  return isBostaShippingAvailable(env);
}

export function trackingUrlFor(trackingNumber: string): string {
  return `${BOSTA_TRACK_URL}?trackingNumber=${encodeURIComponent(trackingNumber)}`;
}

export function toShipmentDTO(row: shipmentsRepo.ShipmentRow): ShipmentDTO {
  const dto: ShipmentDTO = {
    id: row.id,
    orderId: row.orderId,
    provider: 'bosta',
    codAmount: row.codAmount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if (row.bostaDeliveryId) dto.bostaDeliveryId = row.bostaDeliveryId;
  if (row.trackingNumber) {
    dto.trackingNumber = row.trackingNumber;
    dto.trackingUrl = trackingUrlFor(row.trackingNumber);
  }
  if (row.bostaState) dto.bostaState = row.bostaState;
  if (row.mappedStatus) dto.mappedStatus = row.mappedStatus;
  return dto;
}

/**
 * Map Bosta delivery state (code or label) → our OrderStatus.
 * Codes verified against Bosta docs historically; also accepts string labels.
 */
export function mapBostaStateToOrderStatus(
  state: unknown,
): OrderStatus | null {
  if (state == null) return null;

  if (typeof state === 'object' && state !== null && 'code' in state) {
    return mapBostaStateToOrderStatus((state as { code: unknown }).code);
  }

  const code = typeof state === 'number' ? state : Number(state);
  if (Number.isFinite(code)) {
    // Common Bosta numeric codes
    if (code === 45) return 'delivered';
    if (code === 30 || code === 41) return 'out_for_delivery';
    if (code === 20 || code === 21 || code === 22 || code === 40) return 'shipped';
    if (code === 10 || code === 11 || code === 24 || code === 25) return 'sourced';
    if (code === 46 || code === 47 || code === 48 || code === 49 || code === 100) {
      return 'cancelled';
    }
  }

  const label = String(state).toLowerCase();
  if (/deliver(ed|y completed)/.test(label)) return 'delivered';
  if (/out.?for.?deliver|ofd/.test(label)) return 'out_for_delivery';
  if (/picked|in.?transit|warehouse|received|shipped/.test(label)) {
    return 'shipped';
  }
  if (/created|pickup.?request|pending|new/.test(label)) return 'sourced';
  if (/return|cancel|exception|terminat/.test(label)) return 'cancelled';
  return null;
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? 'Customer';
  const last = parts.slice(1).join(' ') || first;
  return { first, last };
}

async function createLiveDelivery(
  secrets: BostaSecrets,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetchWithRetry(
    `${BOSTA_BASE}/deliveries?apiVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: secrets.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    { label: 'bosta-create' },
  );
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof raw.message === 'string'
        ? raw.message
        : `Bosta delivery failed (${res.status})`;
    throw new ValidationError(msg);
  }
  // Some responses wrap in { data, success }
  if (raw.data && typeof raw.data === 'object') {
    return raw.data as Record<string, unknown>;
  }
  return raw;
}

async function getLiveDelivery(
  secrets: BostaSecrets,
  deliveryId: string,
): Promise<Record<string, unknown>> {
  const res = await fetchWithRetry(
    `${BOSTA_BASE}/deliveries/${encodeURIComponent(deliveryId)}`,
    {
      headers: { Authorization: secrets.apiKey },
    },
    { label: 'bosta-get' },
  );
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ValidationError(
      typeof raw.message === 'string'
        ? raw.message
        : `Bosta fetch failed (${res.status})`,
    );
  }
  if (raw.data && typeof raw.data === 'object') {
    return raw.data as Record<string, unknown>;
  }
  return raw;
}

/**
 * Create (or return existing) Bosta shipment for an order.
 * Safe to call multiple times — returns existing when already linked.
 * Pass `db`/`env` from cron jobs (no OpenNext request context).
 */
export async function createShipmentForOrder(
  orderId: string,
  opts: {
    force?: boolean;
    db?: Db;
    env?: CloudflareEnv;
  } = {},
): Promise<ShipmentDTO> {
  const env = opts.env ?? (await getCloudflareEnv());
  if (!isFeatureEnabled('bosta_shipping')) {
    throw new ValidationError('Bosta shipping is not enabled');
  }
  const secrets = readBostaSecrets(env);
  if (!secrets) throw new ValidationError('Bosta is not configured');

  const db = opts.db ?? (await getRequestDb());
  const found = await ordersRepo.findOrderById(db, orderId);
  if (!found) throw new NotFoundError('Order not found');
  const { order, items } = found;

  if (order.status === 'cancelled') {
    throw new ValidationError('Cannot ship a cancelled order');
  }
  if (
    order.paymentMethod !== 'cod' &&
    order.paymentStatus !== 'paid'
  ) {
    throw new ValidationError('Order is not ready to ship (payment pending)');
  }

  const existing = await shipmentsRepo.findShipmentByOrderId(db, orderId);
  if (existing?.trackingNumber && !opts.force) {
    return toShipmentDTO(existing);
  }

  const gov = await govRepo.findGovernorateById(db, order.governorateId);
  const city =
    gov?.bostaCityId?.trim() ||
    gov?.name ||
    order.city;
  if (!city) {
    throw new ValidationError(
      `Governorate ${order.governorateId} has no Bosta city mapping`,
    );
  }

  const { first, last } = splitName(order.fullName);
  const codAmount = order.paymentMethod === 'cod' ? order.total : 0;
  const now = new Date();

  let deliveryId: string;
  let trackingNumber: string;
  let bostaState: string;
  let raw: Record<string, unknown>;

  if (secrets.mock) {
    deliveryId = `mock_dlv_${order.id}`;
    trackingNumber = `BST${Date.now().toString(36).toUpperCase()}`;
    bostaState = '10';
    raw = { mock: true, deliveryId, trackingNumber, state: 10 };
  } else {
    const payload: Record<string, unknown> = {
      type: 10, // SEND
      cod: codAmount,
      businessReference: order.id,
      notes: order.note ?? order.addressNotes ?? undefined,
      webhookUrl: `${SITE.url.replace(/\/$/, '')}/api/webhooks/bosta?secret=${encodeURIComponent(secrets.webhookSecret)}`,
      receiver: {
        firstName: first,
        lastName: last,
        phone: order.phone,
        email: `order+${order.id.toLowerCase()}@${new URL(SITE.url).hostname}`,
      },
      dropOffAddress: {
        city,
        zone: gov?.bostaZone?.trim() || order.city,
        district: gov?.bostaDistrict?.trim() || order.city,
        firstLine: order.street,
      },
      specs: {
        packageType: 'Parcel',
        size: 'SMALL',
        packageDetails: {
          itemsCount: items.reduce((s, i) => s + i.quantity, 0),
          description: items
            .map((i) => i.name)
            .join(', ')
            .slice(0, 200),
        },
      },
    };
    if (secrets.businessId) payload.businessLocationId = secrets.businessId;

    raw = await createLiveDelivery(secrets, payload);
    deliveryId = String(raw._id ?? raw.id ?? '');
    trackingNumber = String(raw.trackingNumber ?? raw.tracking_number ?? '');
    const stateRaw = raw.state ?? raw.deliveryState;
    bostaState =
      typeof stateRaw === 'object' && stateRaw && 'code' in stateRaw
        ? String((stateRaw as { code: unknown }).code)
        : String(stateRaw ?? '10');
    if (!deliveryId || !trackingNumber) {
      throw new ValidationError('Bosta response missing delivery id/tracking');
    }
  }

  const mapped = mapBostaStateToOrderStatus(bostaState) ?? 'sourced';
  let shipment: shipmentsRepo.ShipmentRow;

  if (existing) {
    const updated = await shipmentsRepo.updateShipment(db, existing.id, {
      bostaDeliveryId: deliveryId,
      trackingNumber,
      bostaState,
      mappedStatus: mapped,
      codAmount,
      raw,
      updatedAt: now,
    });
    if (!updated) throw new Error('Failed to update shipment');
    shipment = updated;
  } else {
    shipment = await shipmentsRepo.insertShipment(db, {
      id: `shp_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      orderId: order.id,
      provider: 'bosta',
      bostaDeliveryId: deliveryId,
      trackingNumber,
      bostaState,
      lastEventId: null,
      mappedStatus: mapped,
      codAmount,
      raw,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Advance order into fulfilment when still early
  if (order.status === 'placed' || order.status === 'confirmed') {
    const next: OrderStatus = mapped === 'sourced' ? 'sourced' : mapped;
    if (next !== order.status) {
      await ordersRepo.updateOrderStatus(db, order.id, next);
      await recordOrderStatusChange(db, {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: next,
        actor: 'bosta',
        note: `Bosta delivery created · ${trackingNumber}`,
      });
    }
  }

  return toShipmentDTO(shipment);
}

/** Best-effort — never throws to checkout/payment callers. */
export async function tryAutoCreateShipment(
  orderId: string,
  opts: { db?: Db; env?: CloudflareEnv } = {},
): Promise<void> {
  try {
    const env = opts.env ?? (await getCloudflareEnv());
    if (!isBostaShippingAvailable(env)) return;
    await createShipmentForOrder(orderId, opts);
  } catch (err) {
    console.error('[bosta auto-create]', orderId, err);
  }
}

export async function getShipmentForOrder(
  orderId: string,
): Promise<ShipmentDTO | null> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, orderId);
  if (!found) throw new NotFoundError('Order not found');
  const row = await shipmentsRepo.findShipmentByOrderId(db, orderId);
  return row ? toShipmentDTO(row) : null;
}

export async function refreshShipmentForOrder(
  orderId: string,
  opts: { db?: Db; env?: CloudflareEnv } = {},
): Promise<ShipmentDTO> {
  const env = opts.env ?? (await getCloudflareEnv());
  if (!isFeatureEnabled('bosta_shipping')) {
    throw new ValidationError('Bosta shipping is not enabled');
  }
  const secrets = readBostaSecrets(env);
  if (!secrets) throw new ValidationError('Bosta is not configured');

  const db = opts.db ?? (await getRequestDb());
  const shipment = await shipmentsRepo.findShipmentByOrderId(db, orderId);
  if (!shipment?.bostaDeliveryId) {
    return createShipmentForOrder(orderId, opts);
  }

  if (secrets.mock) {
    return toShipmentDTO(shipment);
  }

  const raw = await getLiveDelivery(secrets, shipment.bostaDeliveryId);
  const stateRaw = raw.state ?? raw.deliveryState;
  const bostaState =
    typeof stateRaw === 'object' && stateRaw && 'code' in stateRaw
      ? String((stateRaw as { code: unknown }).code)
      : String(stateRaw ?? shipment.bostaState ?? '');
  const trackingNumber =
    String(raw.trackingNumber ?? raw.tracking_number ?? '') ||
    shipment.trackingNumber;
  const mapped = mapBostaStateToOrderStatus(bostaState);

  const updated = await shipmentsRepo.updateShipment(db, shipment.id, {
    bostaState,
    trackingNumber: trackingNumber ?? shipment.trackingNumber,
    mappedStatus: mapped ?? shipment.mappedStatus,
    raw,
    updatedAt: new Date(),
  });
  if (!updated) throw new Error('Failed to refresh shipment');

  if (mapped) {
    await applyShipmentStatusToOrder(db, orderId, mapped, bostaState);
  }

  return toShipmentDTO(updated);
}

async function applyShipmentStatusToOrder(
  db: Db,
  orderId: string,
  next: OrderStatus,
  bostaState: string,
): Promise<void> {
  const found = await ordersRepo.findOrderById(db, orderId);
  if (!found) return;
  if (found.order.status === next) return;
  if (found.order.status === 'cancelled' && next !== 'cancelled') return;

  const prev = found.order.status;
  await ordersRepo.updateOrderStatus(db, orderId, next);
  await recordOrderStatusChange(db, {
    orderId,
    fromStatus: prev,
    toStatus: next,
    actor: 'bosta',
    note: `Bosta state ${bostaState}`,
  });

  if (next === 'delivered' && prev !== 'delivered') {
    await commitSaleForOrder(db, orderId, found.items).catch((err) => {
      console.error('[bosta commit sale]', orderId, err);
    });
  }
}

export async function handleBostaWebhook(
  request: Request,
): Promise<{ ok: true; alreadyProcessed?: boolean }> {
  const env = await getCloudflareEnv();
  const secrets = readBostaSecrets(env);
  if (!secrets) throw new ForbiddenError('Bosta is not configured');

  const url = new URL(request.url);
  const secret =
    url.searchParams.get('secret') ||
    request.headers.get('x-bosta-secret') ||
    '';
  const mockOk = secrets.mock && (secret === 'mock' || !secrets.webhookSecret);
  if (
    !mockOk &&
    (!secrets.webhookSecret || !secretsEqual(secret, secrets.webhookSecret))
  ) {
    throw new ForbiddenError('Invalid Bosta webhook secret');
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    throw new ValidationError('Invalid webhook body');
  }

  const deliveryId = String(
    body._id ?? body.id ?? body.deliveryId ?? body.delivery_id ?? '',
  );
  const trackingNumber = String(
    body.trackingNumber ?? body.tracking_number ?? '',
  );
  const eventId = String(
    body.eventId ?? body.event_id ?? body.updateId ?? `${deliveryId}:${body.state ?? ''}`,
  );

  const db = await getRequestDb();
  let shipment =
    (deliveryId
      ? await shipmentsRepo.findShipmentByDeliveryId(db, deliveryId)
      : null) ??
    (trackingNumber
      ? await shipmentsRepo.findShipmentByTracking(db, trackingNumber)
      : null);

  if (!shipment) {
    const businessRef = String(
      body.businessReference ?? body.business_reference ?? '',
    );
    if (businessRef) {
      shipment = await shipmentsRepo.findShipmentByOrderId(db, businessRef);
    }
  }

  if (!shipment) {
    throw new NotFoundError('Shipment not found for webhook');
  }

  if (shipment.lastEventId && shipment.lastEventId === eventId) {
    return { ok: true, alreadyProcessed: true };
  }

  const claimed = await webhookEventsRepo.tryClaimWebhookEvent(db, {
    provider: 'bosta',
    eventId: `${shipment.id}:${eventId}`,
    orderId: shipment.orderId,
  });
  if (!claimed) {
    return { ok: true, alreadyProcessed: true };
  }

  const stateRaw = body.state ?? body.deliveryState ?? body.newState;
  const bostaState =
    typeof stateRaw === 'object' && stateRaw && 'code' in stateRaw
      ? String((stateRaw as { code: unknown }).code)
      : String(stateRaw ?? shipment.bostaState ?? '');
  const mapped = mapBostaStateToOrderStatus(stateRaw ?? bostaState);

  await shipmentsRepo.updateShipment(db, shipment.id, {
    bostaState,
    lastEventId: eventId,
    mappedStatus: mapped ?? shipment.mappedStatus,
    trackingNumber:
      trackingNumber || shipment.trackingNumber || undefined,
    raw: body,
    updatedAt: new Date(),
  });

  if (mapped) {
    await applyShipmentStatusToOrder(db, shipment.orderId, mapped, bostaState);
  }

  return { ok: true };
}

export async function listAdminShipments(
  url: URL,
): Promise<Paginated<ShipmentDTO>> {
  const db = await getRequestDb();
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20;
  const q = url.searchParams.get('q') ?? undefined;
  const { rows, total, page: p, pageSize: ps } =
    await shipmentsRepo.listShipments(db, { q, page, pageSize });
  return {
    items: rows.map(toShipmentDTO),
    page: p,
    pageSize: ps,
    total,
    totalPages: Math.max(1, Math.ceil(total / ps)),
  };
}
