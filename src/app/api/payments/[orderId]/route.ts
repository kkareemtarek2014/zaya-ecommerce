import { withHandler } from '@/server/http/handler';
import { getPaymentStatusForOrder } from '@/server/services/paymob.service';

type Ctx = { params: Promise<{ orderId: string }> };

export const GET = withHandler(async (_request, context) => {
  const { orderId } = await (context as Ctx).params;
  return getPaymentStatusForOrder(decodeURIComponent(orderId));
});
