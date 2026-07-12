import { withHandler } from '@/server/http/handler';
import { getOrderById } from '@/server/services/order.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (_request, context) => {
  const { id } = await (context as Ctx).params;
  return getOrderById(id);
});
