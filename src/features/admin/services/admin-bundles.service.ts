import { api } from '@/shared/lib/api-client';
import type {
  AdminBundleDTO,
  AdminBundleUpdate,
  AdminBundleWrite,
} from '@/shared/contracts/admin-bundles.contract';

export const adminBundlesService = {
  list(): Promise<AdminBundleDTO[]> {
    return api.get('/api/admin/bundles');
  },
  create(input: AdminBundleWrite): Promise<AdminBundleDTO> {
    return api.post('/api/admin/bundles', input);
  },
  update(id: string, input: AdminBundleUpdate): Promise<AdminBundleDTO> {
    return api.put(`/api/admin/bundles/${encodeURIComponent(id)}`, input);
  },
  toggle(id: string, active: boolean): Promise<AdminBundleDTO> {
    return api.patch(`/api/admin/bundles/${encodeURIComponent(id)}`, {
      active,
    });
  },
  delete(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/bundles/${encodeURIComponent(id)}`);
  },
};
