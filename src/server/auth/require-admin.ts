import 'server-only';
import { ForbiddenError } from '@/server/http/errors';
import { requireAuth, type AuthContext } from '@/server/auth/require-auth';
import { rateLimitByIp } from '@/server/http/rate-limit';
import {
  hasPermission,
  isStaffRole,
  type Permission,
} from '@/shared/rbac';

/**
 * Any staff role (admin dashboard access). Rate-limits admin API traffic.
 * Prefer `requirePermission` for mutation/domain routes.
 */
export async function requireAdmin(request: Request): Promise<AuthContext> {
  rateLimitByIp(request, 'admin');
  const ctx = await requireAuth(request);
  if (!isStaffRole(ctx.user.role)) {
    throw new ForbiddenError('Admin access required');
  }
  return ctx;
}

/**
 * Staff + specific permission. Throws FORBIDDEN when the role lacks `permission`.
 */
export async function requirePermission(
  request: Request,
  permission: Permission,
): Promise<AuthContext> {
  const ctx = await requireAdmin(request);
  if (!hasPermission(ctx.user.role, permission)) {
    throw new ForbiddenError('You do not have permission for this action');
  }
  return ctx;
}
