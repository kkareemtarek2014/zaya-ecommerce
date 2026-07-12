import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import { readSessionToken } from '@/server/auth/session';
import { ok } from '@/server/http/envelope';
import { rateLimitByIp } from '@/server/http/rate-limit';
import { createBridalRequestFromForm } from '@/server/services/bridal.service';

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
  rateLimitByIp(request, 'bridal');
  const formData = await request.formData();
  const userId = await optionalUserId(request);
  const result = await createBridalRequestFromForm(formData, userId);
  return ok(result, 201);
});
