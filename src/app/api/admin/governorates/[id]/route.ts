import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return locations.updateAdminGovernorate(id, body);
});

export const DELETE = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return locations.deleteAdminGovernorate(id);
});
