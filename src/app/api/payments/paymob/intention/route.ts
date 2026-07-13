import { withHandler } from '@/server/http/handler';
import { rateLimitByIp } from '@/server/http/rate-limit';
import { createPaymobIntention } from '@/server/services/paymob.service';

export const POST = withHandler(async (request) => {
  rateLimitByIp(request, 'paymob-intention');
  const body: unknown = await request.json();
  return createPaymobIntention(body);
});
