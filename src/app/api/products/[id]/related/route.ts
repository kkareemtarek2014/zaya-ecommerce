import { withHandler } from '@/server/http/handler';
import { getRelated } from '@/server/services/product.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  const { id } = await (context as Ctx).params;
  const limitParam = new URL(request.url).searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 4;
  return getRelated(id, Number.isFinite(limit) ? limit : 4);
});
