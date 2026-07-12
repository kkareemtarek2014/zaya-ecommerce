'use client';

import { useMutation } from '@tanstack/react-query';
import type { BridalRequestFormValues } from '../schema/bridal-request.schema';
import { bridalService } from '../services/bridal.service';

export function useSubmitBridalRequest() {
  return useMutation({
    mutationFn: (values: BridalRequestFormValues) => bridalService.submit(values),
  });
}
