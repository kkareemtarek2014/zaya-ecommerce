import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import * as accountService from '@/server/services/account.service';

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withHandler(async (request, context) => {
  const { user } = await requireAuth(request);
  const { id } = await (context as Ctx).params;
  return accountService.removeAddress(user.id, id);
});
