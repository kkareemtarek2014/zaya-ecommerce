import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import { readSessionToken } from '@/server/auth/session';
import { createOrder, listOrdersForUser } from '@/server/services/order.service';
import { ok } from '@/server/http/envelope';

/** Soft session read — guests may place COD orders. */
async function optionalUserId(request: Request): Promise<string | null> {
  if (!readSessionToken(request)) return null;
  try {
    const { user } = await requireAuth(request);
    return user.id;
  } catch {
    return null;
  }
}

export const POST = withHandler(async (request) => {
  const body: unknown = await request.json();
  const userId = await optionalUserId(request);
  const order = await createOrder(body, userId);
  return ok(order, 201);
});

export const GET = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  return listOrdersForUser(user.id);
});
