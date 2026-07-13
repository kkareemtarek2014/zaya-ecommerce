import { api } from '@/shared/lib/api-client';
import type {
  HomepageBlockDTO,
  HomepageBlockUpdate,
  HomepageBlockWrite,
} from '@/shared/contracts/homepage.contract';

export const adminHomepageService = {
  list(): Promise<HomepageBlockDTO[]> {
    return api.get('/api/admin/homepage-blocks');
  },
  create(input: HomepageBlockWrite): Promise<HomepageBlockDTO> {
    return api.post('/api/admin/homepage-blocks', input);
  },
  update(
    id: string,
    input: HomepageBlockUpdate,
  ): Promise<HomepageBlockDTO> {
    return api.put(
      `/api/admin/homepage-blocks/${encodeURIComponent(id)}`,
      input,
    );
  },
  remove(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/homepage-blocks/${encodeURIComponent(id)}`);
  },
  reorder(ids: string[]): Promise<HomepageBlockDTO[]> {
    return api.post('/api/admin/homepage-blocks/reorder', { ids });
  },
};
