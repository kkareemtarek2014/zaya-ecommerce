import 'server-only';
import {
  adminPromoActiveSchema,
  adminPromoUpdateSchema,
  adminPromoWriteSchema,
  type AdminPromoDTO,
} from '@/shared/contracts/admin-config.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as promosRepo from '@/server/repositories/promos.repo';
import type { PromoRow } from '@/server/repositories/promos.repo';

function toPromoDTO(row: PromoRow): AdminPromoDTO {
  return {
    code: row.code,
    type: row.type,
    value: row.value,
    ...(row.minOrderValue != null ? { minOrderValue: row.minOrderValue } : {}),
    active: row.active,
  };
}

export async function listAdminPromos(): Promise<AdminPromoDTO[]> {
  const db = await getRequestDb();
  const rows = await promosRepo.findAllPromos(db);
  return rows.map(toPromoDTO);
}

export async function createAdminPromo(raw: unknown): Promise<AdminPromoDTO> {
  const parsed = adminPromoWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await promosRepo.findPromoByCode(db, parsed.data.code);
  if (existing) throw new ConflictError('Promo code already exists');

  const row = await promosRepo.insertPromo(db, {
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    minOrderValue: parsed.data.minOrderValue,
    active: parsed.data.active ?? true,
  });
  return toPromoDTO(row);
}

export async function updateAdminPromo(
  code: string,
  raw: unknown,
): Promise<AdminPromoDTO> {
  const parsed = adminPromoUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (Object.keys(parsed.data).length === 0) {
    throw new ValidationError('No fields to update');
  }
  const db = await getRequestDb();
  const existing = await promosRepo.findPromoByCode(db, code);
  if (!existing) throw new NotFoundError('Promo not found');

  const nextType = parsed.data.type ?? existing.type;
  const nextValue = parsed.data.value ?? existing.value;
  if (nextType === 'percentage' && (nextValue <= 0 || nextValue > 1)) {
    throw new ValidationError(
      'Percentage value must be between 0 and 1 (e.g. 0.1 = 10%)',
    );
  }

  const row = await promosRepo.updatePromo(db, code, parsed.data);
  if (!row) throw new NotFoundError('Promo not found');
  return toPromoDTO(row);
}

export async function toggleAdminPromo(
  code: string,
  raw: unknown,
): Promise<AdminPromoDTO> {
  const parsed = adminPromoActiveSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await promosRepo.findPromoByCode(db, code);
  if (!existing) throw new NotFoundError('Promo not found');
  const row = await promosRepo.updatePromo(db, code, {
    active: parsed.data.active,
  });
  if (!row) throw new NotFoundError('Promo not found');
  return toPromoDTO(row);
}

export async function deleteAdminPromo(
  code: string,
): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const removed = await promosRepo.deletePromo(db, code);
  if (!removed) throw new NotFoundError('Promo not found');
  return { ok: true };
}
