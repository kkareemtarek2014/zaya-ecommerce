import 'server-only';
import { ForbiddenError } from '@/server/http/errors';
import { requireAuth, type AuthContext } from '@/server/auth/require-auth';
import { rateLimitByIp } from '@/server/http/rate-limit';

/**
 * requireAuth + role === 'admin'. Throws FORBIDDEN (403) for customers.
 * Rate-limits all admin API traffic (60 req / 60s / IP).
 */
export async function requireAdmin(request: Request): Promise<AuthContext> {
  rateLimitByIp(request, 'admin');
  const ctx = await requireAuth(request);
  if (ctx.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return ctx;
}
