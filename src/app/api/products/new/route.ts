import { withHandler } from '@/server/http/handler';
import { getNewArrivals } from '@/server/services/product.service';

export const GET = withHandler(async (request) => {
  const limitParam = new URL(request.url).searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 8;
  return getNewArrivals(Number.isFinite(limit) ? limit : 8);
});
