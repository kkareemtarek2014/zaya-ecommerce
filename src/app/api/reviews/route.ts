import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import { ok } from '@/server/http/envelope';
import {
  createReview,
  getReviewsForProduct,
} from '@/server/services/review.service';

export const GET = withHandler(async (request) => {
  const productId = new URL(request.url).searchParams.get('productId') ?? '';
  return getReviewsForProduct(productId);
});

export const POST = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  const body: unknown = await request.json();
  const review = await createReview(
    { id: user.id, name: user.name },
    body,
  );
  return ok(review, 201);
});
