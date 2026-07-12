import 'server-only';
import {
  adminBridalStatusSchema,
  type AdminBridalRequestDTO,
} from '@/shared/contracts/admin-config.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError, ValidationError } from '@/server/http/errors';
import * as bridalRepo from '@/server/repositories/bridal-requests.repo';
import type { BridalRequestRow } from '@/server/repositories/bridal-requests.repo';
import { ok } from '@/server/http/envelope';

function toAdminBridal(row: BridalRequestRow): AdminBridalRequestDTO {
  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    ...(row.weddingDate ? { weddingDate: row.weddingDate } : {}),
    description: row.description,
    ...(row.fileName ? { fileName: row.fileName } : {}),
    ...(row.fileType ? { fileType: row.fileType } : {}),
    ...(row.fileKey ? { mediaUrl: `/api/media/${row.fileKey}` } : {}),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAdminBridalRequests(url: URL) {
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20;
  const statusRaw = url.searchParams.get('status');
  let status: 'pending' | 'answered' | undefined;
  if (statusRaw === 'pending' || statusRaw === 'answered') status = statusRaw;
  else if (statusRaw) throw new ValidationError('Invalid status filter');

  const db = await getRequestDb();
  const { rows, total, page: p, pageSize: ps } =
    await bridalRepo.listBridalRequests(db, { status, page, pageSize });

  const data: Paginated<AdminBridalRequestDTO> = {
    items: rows.map(toAdminBridal),
    page: p,
    pageSize: ps,
    total,
    totalPages: Math.max(1, Math.ceil(total / ps)),
  };
  return ok(data);
}

export async function getAdminBridalRequest(
  id: string,
): Promise<AdminBridalRequestDTO> {
  const db = await getRequestDb();
  const row = await bridalRepo.findBridalRequestById(db, id);
  if (!row) throw new NotFoundError('Bridal request not found');
  return toAdminBridal(row);
}

export async function patchAdminBridalRequest(
  id: string,
  raw: unknown,
): Promise<AdminBridalRequestDTO> {
  const parsed = adminBridalStatusSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await bridalRepo.findBridalRequestById(db, id);
  if (!existing) throw new NotFoundError('Bridal request not found');
  const row = await bridalRepo.updateBridalStatus(db, id, parsed.data.status);
  if (!row) throw new NotFoundError('Bridal request not found');
  return toAdminBridal(row);
}
