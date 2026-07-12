import 'server-only';
import {
  createReviewInputSchema,
  reviewItemSchema,
  type ReviewsResponse,
} from '@/shared/contracts/review.contract';
import type { z } from 'zod';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError, ValidationError } from '@/server/http/errors';
import * as reviewsRepo from '@/server/repositories/reviews.repo';

type ReviewItem = z.infer<typeof reviewItemSchema>;

function toItem(row: reviewsRepo.ReviewRow): ReviewItem {
  return {
    id: row.id,
    authorName: row.authorName,
    rating: row.rating,
    comment: row.comment,
    helpful: row.helpful,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReviewsForProduct(
  productId: string,
): Promise<ReviewsResponse> {
  if (!productId) {
    throw new ValidationError('productId is required');
  }
  const db = await getRequestDb();
  const rows = await reviewsRepo.listReviewsByProduct(db, productId);
  const breakdown = await reviewsRepo.ratingBreakdown(db, productId);
  const count = rows.length;
  const average =
    count === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, r) => sum + r.rating, 0) / count) * 10,
        ) / 10;

  return {
    summary: { average, count, breakdown },
    items: rows.map(toItem),
  };
}

export async function createReview(
  user: { id: string; name: string },
  raw: unknown,
): Promise<ReviewItem> {
  const parsed = createReviewInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const exists = await reviewsRepo.productExists(db, parsed.data.productId);
  if (!exists) throw new NotFoundError('Product not found');

  const id = `rev_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const row = await reviewsRepo.createReview(db, {
    id,
    productId: parsed.data.productId,
    userId: user.id,
    authorName: user.name,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    createdAt: new Date(),
  });
  await reviewsRepo.recomputeProductRating(db, parsed.data.productId);
  return toItem(row);
}
