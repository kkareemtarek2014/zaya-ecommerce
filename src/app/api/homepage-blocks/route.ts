import { withHandler } from '@/server/http/handler';
import { listActiveHomepageBlocks } from '@/server/services/admin-homepage.service';

export const GET = withHandler(async () => listActiveHomepageBlocks());
