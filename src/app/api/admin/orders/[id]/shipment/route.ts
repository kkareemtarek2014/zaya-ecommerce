import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import {
  createShipmentForOrder,
  getShipmentForOrder,
  refreshShipmentForOrder,
} from '@/server/services/bosta.service';
import { writeAuditLog } from '@/server/services/audit.service';
import { NotFoundError } from '@/server/http/errors';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requirePermission(request, 'orders:read');
  const { id } = await (context as Ctx).params;
  const refresh = new URL(request.url).searchParams.get('refresh') === '1';
  if (refresh) {
    return refreshShipmentForOrder(id);
  }
  const shipment = await getShipmentForOrder(id);
  if (!shipment) throw new NotFoundError('No shipment for this order');
  return shipment;
});

export const POST = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'orders:write');
  const { id } = await (context as Ctx).params;
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  const shipment = await createShipmentForOrder(id, {
    force: Boolean(body?.force),
  });
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'shipment',
    entityId: shipment.id,
    meta: { orderId: id },
  });
  return shipment;
});
