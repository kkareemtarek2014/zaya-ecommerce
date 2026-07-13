import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';
import { ValidationError } from '@/server/http/errors';

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'products:write');
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('CSV file is required (field: file)');
  }
  const text = await file.text();
  const report = await adminCatalog.importAdminProductsCsv(text);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'product',
    entityId: 'import',
    meta: {
      created: report.created,
      updated: report.updated,
      errors: report.errors.length,
    },
  });
  return report;
});
