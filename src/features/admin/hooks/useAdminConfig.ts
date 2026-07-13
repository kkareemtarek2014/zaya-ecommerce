'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminGovernorateWrite,
  AdminPromoWrite,
  AdminSettingsWrite,
} from '@/shared/contracts/admin-config.contract';
import type { AdminGovernorateDTO } from '@/shared/contracts/product.contract';
import {
  adminBridalService,
  adminLocationsService,
  adminPromosService,
  adminSettingsService,
  storefrontConfigService,
  type BridalListParams,
} from '../services/admin-config.service';

export const adminConfigKeys = {
  storefront: ['storefront-config'] as const,
  governorates: ['admin', 'governorates'] as const,
  zones: ['admin', 'shipping-zones'] as const,
  promos: ['admin', 'promos'] as const,
  bridal: (params: BridalListParams) =>
    ['admin', 'bridal', params] as const,
  bridalOne: (id: string) => ['admin', 'bridal', id] as const,
  settings: ['admin', 'settings'] as const,
};

export function useStorefrontConfig() {
  return useQuery({
    queryKey: adminConfigKeys.storefront,
    queryFn: () => storefrontConfigService.get(),
    staleTime: 60_000,
  });
}

export function useAdminGovernorates() {
  return useQuery({
    queryKey: adminConfigKeys.governorates,
    queryFn: () => adminLocationsService.listGovernorates(),
  });
}

export function useAdminShippingZones() {
  return useQuery({
    queryKey: adminConfigKeys.zones,
    queryFn: () => adminLocationsService.listZones(),
  });
}

export function useCreateGovernorate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminGovernorateWrite) =>
      adminLocationsService.createGovernorate(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.governorates });
    },
  });
}

export function useUpdateGovernorate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        name?: string;
        zone?: AdminGovernorateDTO['zone'];
        bostaCityId?: string | null;
        bostaZone?: string | null;
        bostaDistrict?: string | null;
      };
    }) => adminLocationsService.updateGovernorate(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.governorates });
    },
  });
}

export function useDeleteGovernorate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLocationsService.deleteGovernorate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.governorates });
    },
  });
}

export function useUpdateZoneFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zone, fee }: { zone: string; fee: number }) =>
      adminLocationsService.updateZoneFee(zone, fee),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.zones });
      void qc.invalidateQueries({ queryKey: adminConfigKeys.storefront });
    },
  });
}

export function useAdminPromos() {
  return useQuery({
    queryKey: adminConfigKeys.promos,
    queryFn: () => adminPromosService.list(),
  });
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminPromoWrite) => adminPromosService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.promos });
    },
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      input,
    }: {
      code: string;
      input: Parameters<typeof adminPromosService.update>[1];
    }) => adminPromosService.update(code, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.promos });
    },
  });
}

export function useTogglePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      adminPromosService.toggle(code, active),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.promos });
    },
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => adminPromosService.delete(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminConfigKeys.promos });
    },
  });
}

export function useAdminBridalRequests(params: BridalListParams) {
  return useQuery({
    queryKey: adminConfigKeys.bridal(params),
    queryFn: () => adminBridalService.list(params),
  });
}

export function useAdminBridalRequest(id: string) {
  return useQuery({
    queryKey: adminConfigKeys.bridalOne(id),
    queryFn: () => adminBridalService.get(id),
    enabled: Boolean(id),
  });
}

export function useUpdateBridalStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: 'pending' | 'answered') =>
      adminBridalService.updateStatus(id, status),
    onSuccess: (row) => {
      qc.setQueryData(adminConfigKeys.bridalOne(id), row);
      void qc.invalidateQueries({ queryKey: ['admin', 'bridal'] });
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminConfigKeys.settings,
    queryFn: () => adminSettingsService.get(),
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminSettingsWrite) =>
      adminSettingsService.update(input),
    onSuccess: (data) => {
      qc.setQueryData(adminConfigKeys.settings, data);
      void qc.invalidateQueries({ queryKey: adminConfigKeys.storefront });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
