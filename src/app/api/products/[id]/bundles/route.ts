import { withHandler } from '@/server/http/handler';
import { listStorefrontBundleHintsForProduct } from '@/server/services/bundle.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (_request, context) => {
  const { id } = await (context as Ctx).params;
  return listStorefrontBundleHintsForProduct(id);
});
