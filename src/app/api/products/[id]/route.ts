import { withHandler } from '@/server/http/handler';
import { getProduct } from '@/server/services/product.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (_request, context) => {
  const { id } = await (context as Ctx).params;
  return getProduct(id);
});
