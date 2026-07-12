import 'server-only';
import { ForbiddenError } from '@/server/http/errors';
import { requireAuth, type AuthContext } from '@/server/auth/require-auth';

/**
 * requireAuth + role === 'admin'. Throws FORBIDDEN (403) for customers.
 */
export async function requireAdmin(request: Request): Promise<AuthContext> {
  const ctx = await requireAuth(request);
  if (ctx.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return ctx;
}
