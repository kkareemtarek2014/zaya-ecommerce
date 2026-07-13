import { withHandler } from '@/server/http/handler';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError } from '@/server/http/errors';
import * as productsRepo from '@/server/repositories/products.repo';
import { incrementProductView } from '@/server/repositories/product-views.repo';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (_request, context) => {
  const { id } = await (context as Ctx).params;
  const db = await getRequestDb();
  const product = await productsRepo.findProductById(db, id);
  if (!product) throw new NotFoundError('Product not found');
  await incrementProductView(db, id);
  return { ok: true as const };
});
