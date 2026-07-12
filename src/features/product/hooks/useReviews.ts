'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReviewInput } from '@/shared/contracts/review.contract';
import { reviewsService } from '../services/reviews.service';

export const reviewKeys = {
  byProduct: (productId: string) => ['reviews', productId] as const,
};

export function useReviews(productId: string) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId),
    queryFn: () => reviewsService.list(productId),
    enabled: Boolean(productId),
    retry: false,
  });
}

/** Auth-only create — no storefront UI yet (Phase 6 scope). */
export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateReviewInput, 'productId'>) =>
      reviewsService.create({ ...input, productId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) });
    },
  });
}
