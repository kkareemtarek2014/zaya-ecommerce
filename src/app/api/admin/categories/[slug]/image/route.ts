import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import { ValidationError } from '@/server/http/errors';
import * as adminCatalog from '@/server/services/admin-catalog.service';

type Ctx = { params: Promise<{ slug: string }> };

export const POST = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError('No image file provided');
  }
  return adminCatalog.setCategoryImage(decodeURIComponent(slug), file);
});
