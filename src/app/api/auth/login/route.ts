import { withHandler } from '@/server/http/handler';
import { rateLimitByIp } from '@/server/http/rate-limit';
import * as authService from '@/server/services/auth.service';

export const POST = withHandler(async (request) => {
  rateLimitByIp(request, 'auth-login');
  const body: unknown = await request.json();
  return authService.login(request, body);
});
