import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import * as accountService from '@/server/services/account.service';

export const GET = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  return accountService.getProfile(user.id);
});

export const PUT = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  const body: unknown = await request.json();
  return accountService.updateProfile(user.id, body);
});
