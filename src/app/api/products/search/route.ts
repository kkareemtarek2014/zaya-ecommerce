import { withHandler } from '@/server/http/handler';
import { searchProducts } from '@/server/services/product.service';

export const GET = withHandler(async (request) => {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  return searchProducts(q);
});
