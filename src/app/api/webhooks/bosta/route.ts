import { withHandler } from '@/server/http/handler';
import { rateLimitByIp } from '@/server/http/rate-limit';
import { handleBostaWebhook } from '@/server/services/bosta.service';

export const POST = withHandler(async (request) => {
  rateLimitByIp(request, 'bosta-webhook');
  return handleBostaWebhook(request);
});
