import { api } from '@/shared/lib/api-client';
import type { BridalRequestResponse } from '@/shared/contracts/bridal.contract';
import type { BridalRequestFormValues } from '../schema/bridal-request.schema';

export const bridalService = {
  submit(values: BridalRequestFormValues): Promise<BridalRequestResponse> {
    const fd = new FormData();
    fd.set('fullName', values.fullName);
    fd.set('phone', values.phone);
    if (values.weddingDate) fd.set('weddingDate', values.weddingDate);
    fd.set('description', values.description);
    if (values.file) fd.set('file', values.file);
    return api.postForm<BridalRequestResponse>('/api/bridal-requests', fd);
  },
};
