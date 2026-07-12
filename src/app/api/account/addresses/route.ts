import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import { ok } from '@/server/http/envelope';
import * as accountService from '@/server/services/account.service';

export const GET = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  return accountService.listAddresses(user.id);
});

export const POST = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  const body: unknown = await request.json();
  const address = await accountService.addAddress(user.id, body);
  return ok(address, 201);
});
