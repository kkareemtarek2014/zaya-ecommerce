import { api } from '@/shared/lib/api-client';
import type {
  CreateReviewInput,
  ReviewsResponse,
  reviewItemSchema,
} from '@/shared/contracts/review.contract';
import type { z } from 'zod';

type ReviewItem = z.infer<typeof reviewItemSchema>;

export const reviewsService = {
  list(productId: string): Promise<ReviewsResponse> {
    return api.get<ReviewsResponse>(
      `/api/reviews?productId=${encodeURIComponent(productId)}`,
    );
  },

  create(input: CreateReviewInput): Promise<ReviewItem> {
    return api.post<ReviewItem>('/api/reviews', input);
  },
};
