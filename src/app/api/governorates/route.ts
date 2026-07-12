import { withHandler } from '@/server/http/handler';
import { listGovernorates } from '@/server/services/product.service';

export const GET = withHandler(async () => listGovernorates());
