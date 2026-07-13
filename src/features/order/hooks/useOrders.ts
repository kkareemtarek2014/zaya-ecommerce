'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/shared/lib/api-client';
import type { CreateOrderInput, OrderDTO } from '@/shared/contracts/order.contract';
import type { PaymobIntentionResult } from '@/shared/contracts/payment.contract';
import { useCartStore } from '@/features/cart';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
  mine: ['orders', 'mine'] as const,
};

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get<OrderDTO>(`/api/orders/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine,
    queryFn: () => api.get<OrderDTO[]>('/api/orders'),
    retry: false,
  });
}

export function usePlaceOrder() {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const order = await api.post<OrderDTO>('/api/orders', input);
      if (input.paymentMethod === 'card' || input.paymentMethod === 'wallet') {
        const intention = await api.post<PaymobIntentionResult>(
          '/api/payments/paymob/intention',
          { orderId: order.id },
        );
        return { order, intention };
      }
      return { order, intention: null as PaymobIntentionResult | null };
    },
    onSuccess: ({ order, intention }) => {
      clear();
      qc.setQueryData(orderKeys.detail(order.id), order);
      void qc.invalidateQueries({ queryKey: orderKeys.mine });
      if (intention?.checkoutUrl) {
        window.location.assign(intention.checkoutUrl);
        return;
      }
      router.push(`/order/${order.id}`);
    },
  });
}
