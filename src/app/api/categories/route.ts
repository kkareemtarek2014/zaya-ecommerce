import { withHandler } from '@/server/http/handler';
import { listCategories } from '@/server/services/product.service';

export const GET = withHandler(async () => listCategories());
