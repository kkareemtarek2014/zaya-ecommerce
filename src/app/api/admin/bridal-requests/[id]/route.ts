import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as bridal from '@/server/services/admin-bridal.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return bridal.getAdminBridalRequest(id);
});

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return bridal.patchAdminBridalRequest(id, body);
});
