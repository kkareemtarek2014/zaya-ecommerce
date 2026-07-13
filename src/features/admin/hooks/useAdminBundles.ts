'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminBundleUpdate,
  AdminBundleWrite,
} from '@/shared/contracts/admin-bundles.contract';
import { adminBundlesService } from '../services/admin-bundles.service';

export const adminBundlesKeys = {
  all: ['admin', 'bundles'] as const,
};

export function useAdminBundles() {
  return useQuery({
    queryKey: adminBundlesKeys.all,
    queryFn: () => adminBundlesService.list(),
  });
}

export function useCreateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminBundleWrite) => adminBundlesService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBundlesKeys.all });
    },
  });
}

export function useUpdateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: AdminBundleUpdate;
    }) => adminBundlesService.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBundlesKeys.all });
    },
  });
}

export function useToggleBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminBundlesService.toggle(id, active),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBundlesKeys.all });
    },
  });
}

export function useDeleteBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminBundlesService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminBundlesKeys.all });
    },
  });
}
