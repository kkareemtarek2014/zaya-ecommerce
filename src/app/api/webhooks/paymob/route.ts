import { withHandler } from '@/server/http/handler';
import { rateLimitByIp } from '@/server/http/rate-limit';
import { handlePaymobWebhook } from '@/server/services/paymob.service';

export const POST = withHandler(async (request) => {
  rateLimitByIp(request, 'paymob-webhook');
  return handlePaymobWebhook(request);
});
