import { api } from '@/shared/lib/api-client';
import type { ShipmentDTO } from '@/shared/contracts/shipment.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';

export type AdminShipmentListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const adminShipmentsService = {
  list(
    params: AdminShipmentListParams = {},
  ): Promise<Paginated<ShipmentDTO>> {
    return api.get(
      `/api/admin/shipments${toQuery({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
      })}`,
    );
  },

  getForOrder(orderId: string): Promise<ShipmentDTO> {
    return api.get(
      `/api/admin/orders/${encodeURIComponent(orderId)}/shipment`,
    );
  },

  refreshForOrder(orderId: string): Promise<ShipmentDTO> {
    return api.get(
      `/api/admin/orders/${encodeURIComponent(orderId)}/shipment?refresh=1`,
    );
  },

  createForOrder(
    orderId: string,
    input: { force?: boolean } = {},
  ): Promise<ShipmentDTO> {
    return api.post(
      `/api/admin/orders/${encodeURIComponent(orderId)}/shipment`,
      input,
    );
  },
};
