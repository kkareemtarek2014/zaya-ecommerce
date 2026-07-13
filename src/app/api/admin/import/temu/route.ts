import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { rateLimitByIp } from '@/server/http/rate-limit';
import { ForbiddenError } from '@/server/http/errors';
import { importTemuProduct } from '@/server/services/temu-import.service';
import { writeAuditLog } from '@/server/services/audit.service';
import { isTemuScraperEnabled } from '@/server/services/settings.service';

export const POST = withHandler(async (request) => {
  rateLimitByIp(request, 'temu-import');
  const auth = await requirePermission(request, 'products:write');
  if (!(await isTemuScraperEnabled())) {
    throw new ForbiddenError(
      'Temu scraper is stopped from the dashboard. Turn it back on to import.',
    );
  }
  const body: unknown = await request.json();
  const product = await importTemuProduct(body, auth.user.id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'temu_import',
    entityId: product.id,
    meta: { sourceUrl: product.sourceUrl ?? null },
  });
  return product;
});
