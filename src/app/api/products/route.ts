import { withHandler } from '@/server/http/handler';
import { listProducts } from '@/server/services/product.service';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? undefined;
  const featuredParam = searchParams.get('featured');
  const sort = searchParams.get('sort') as
    | 'newest'
    | 'price-asc'
    | 'price-desc'
    | 'rating'
    | null;
  const q = searchParams.get('q') ?? undefined;

  return listProducts({
    category,
    featured: featuredParam === 'true' ? true : undefined,
    sort: sort ?? undefined,
    q,
  });
});
