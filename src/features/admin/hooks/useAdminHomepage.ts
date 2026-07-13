'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  HomepageBlockUpdate,
  HomepageBlockWrite,
} from '@/shared/contracts/homepage.contract';
import { adminHomepageService } from '../services/admin-homepage.service';

export const adminHomepageKeys = {
  all: ['admin', 'homepage-blocks'] as const,
};

export function useAdminHomepageBlocks() {
  return useQuery({
    queryKey: adminHomepageKeys.all,
    queryFn: () => adminHomepageService.list(),
  });
}

export function useCreateHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HomepageBlockWrite) =>
      adminHomepageService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminHomepageKeys.all });
    },
  });
}

export function useUpdateHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: HomepageBlockUpdate;
    }) => adminHomepageService.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminHomepageKeys.all });
    },
  });
}

export function useDeleteHomepageBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminHomepageService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminHomepageKeys.all });
    },
  });
}

export function useReorderHomepageBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => adminHomepageService.reorder(ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminHomepageKeys.all });
    },
  });
}
