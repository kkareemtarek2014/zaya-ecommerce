import { withHandler } from '@/server/http/handler';
import { evaluateBundlesFromInput } from '@/server/services/bundle.service';

export const POST = withHandler(async (request) => {
  const body: unknown = await request.json();
  return evaluateBundlesFromInput(body);
});
