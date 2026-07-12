import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';

/** Smoke endpoint — proves requireAdmin works. No CRUD. */
export const GET = withHandler(async (request) => {
  const { user } = await requireAdmin(request);
  return {
    ok: true as const,
    role: user.role,
    email: user.email,
  };
});
