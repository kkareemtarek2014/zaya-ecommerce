'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppError } from '@/shared/contracts/errors';
import {
  adminShipmentsService,
  type AdminShipmentListParams,
} from '../services/admin-shipments.service';
import { adminOpsKeys } from './useAdminOps';

export const adminShipmentsKeys = {
  list: (params: AdminShipmentListParams) =>
    ['admin', 'shipments', params] as const,
  order: (orderId: string) =>
    ['admin', 'orders', orderId, 'shipment'] as const,
};

export function useAdminShipments(params: AdminShipmentListParams = {}) {
  return useQuery({
    queryKey: adminShipmentsKeys.list(params),
    queryFn: () => adminShipmentsService.list(params),
  });
}

export function useAdminOrderShipment(orderId: string, enabled = true) {
  return useQuery({
    queryKey: adminShipmentsKeys.order(orderId),
    queryFn: () => adminShipmentsService.getForOrder(orderId),
    enabled: Boolean(orderId) && enabled,
    retry: (failureCount, error) => {
      if (error instanceof AppError && error.code === 'NOT_FOUND') return false;
      return failureCount < 2;
    },
  });
}

export function useCreateAdminShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { force?: boolean } = {}) =>
      adminShipmentsService.createForOrder(orderId, input),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminShipmentsKeys.order(orderId),
      });
      void qc.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      void qc.invalidateQueries({
        queryKey: adminOpsKeys.order(orderId),
      });
    },
  });
}

export function useRefreshAdminShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminShipmentsService.refreshForOrder(orderId),
    onSuccess: (data) => {
      qc.setQueryData(adminShipmentsKeys.order(orderId), data);
      void qc.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      void qc.invalidateQueries({
        queryKey: adminOpsKeys.order(orderId),
      });
    },
  });
}
