import 'server-only';
import {
  adminGovernorateUpdateSchema,
  adminGovernorateWriteSchema,
  adminShippingZoneFeeSchema,
  type ShippingZoneDTO,
} from '@/shared/contracts/admin-config.contract';
import type { AdminGovernorateDTO } from '@/shared/contracts/product.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as govRepo from '@/server/repositories/governorates.repo';

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

function toGovDTO(row: govRepo.GovernorateRow): AdminGovernorateDTO {
  const dto: AdminGovernorateDTO = {
    id: row.id,
    name: row.name,
    zone: row.zone,
  };
  dto.bostaCityId = row.bostaCityId ?? null;
  dto.bostaZone = row.bostaZone ?? null;
  dto.bostaDistrict = row.bostaDistrict ?? null;
  return dto;
}

function toZoneDTO(row: govRepo.ShippingZoneRow): ShippingZoneDTO {
  return { zone: row.zone, label: row.label, fee: row.fee };
}

export async function listAdminGovernorates(): Promise<AdminGovernorateDTO[]> {
  const db = await getRequestDb();
  const rows = await govRepo.findAllGovernorates(db);
  return rows.map(toGovDTO);
}

export async function createAdminGovernorate(
  raw: unknown,
): Promise<AdminGovernorateDTO> {
  const parsed = adminGovernorateWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await govRepo.findGovernorateById(db, parsed.data.id);
  if (existing) throw new ConflictError('Governorate id already exists');

  const zone = await govRepo.findShippingZone(db, parsed.data.zone);
  if (!zone) throw new ValidationError('Invalid shipping zone');

  const row = await govRepo.insertGovernorate(db, {
    id: parsed.data.id,
    name: parsed.data.name,
    zone: parsed.data.zone,
    bostaCityId:
      parsed.data.bostaCityId !== undefined
        ? emptyToNull(parsed.data.bostaCityId)
        : parsed.data.name,
    bostaZone: emptyToNull(parsed.data.bostaZone),
    bostaDistrict: emptyToNull(parsed.data.bostaDistrict),
  });
  return toGovDTO(row);
}

export async function updateAdminGovernorate(
  id: string,
  raw: unknown,
): Promise<AdminGovernorateDTO> {
  const parsed = adminGovernorateUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (Object.keys(parsed.data).length === 0) {
    throw new ValidationError('No fields to update');
  }
  const db = await getRequestDb();
  const existing = await govRepo.findGovernorateById(db, id);
  if (!existing) throw new NotFoundError('Governorate not found');

  if (parsed.data.zone) {
    const zone = await govRepo.findShippingZone(db, parsed.data.zone);
    if (!zone) throw new ValidationError('Invalid shipping zone');
  }

  const row = await govRepo.updateGovernorate(db, id, {
    name: parsed.data.name,
    zone: parsed.data.zone,
    bostaCityId:
      parsed.data.bostaCityId !== undefined
        ? emptyToNull(parsed.data.bostaCityId)
        : undefined,
    bostaZone:
      parsed.data.bostaZone !== undefined
        ? emptyToNull(parsed.data.bostaZone)
        : undefined,
    bostaDistrict:
      parsed.data.bostaDistrict !== undefined
        ? emptyToNull(parsed.data.bostaDistrict)
        : undefined,
  });
  if (!row) throw new NotFoundError('Governorate not found');
  return toGovDTO(row);
}

export async function deleteAdminGovernorate(
  id: string,
): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const existing = await govRepo.findGovernorateById(db, id);
  if (!existing) throw new NotFoundError('Governorate not found');
  const refs = await govRepo.countGovernorateRefs(db, id);
  if (refs > 0) {
    throw new ConflictError(
      'Cannot delete governorate referenced by orders or addresses',
    );
  }
  await govRepo.deleteGovernorate(db, id);
  return { ok: true };
}

export async function listAdminShippingZones(): Promise<ShippingZoneDTO[]> {
  const db = await getRequestDb();
  const rows = await govRepo.findAllShippingZones(db);
  return rows.map(toZoneDTO);
}

export async function updateAdminShippingZoneFee(
  zone: string,
  raw: unknown,
): Promise<ShippingZoneDTO> {
  const parsed = adminShippingZoneFeeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (
    zone !== 'cairo_giza' &&
    zone !== 'near' &&
    zone !== 'far'
  ) {
    throw new ValidationError('Invalid zone');
  }
  const db = await getRequestDb();
  const row = await govRepo.updateShippingZoneFee(db, zone, parsed.data.fee);
  if (!row) throw new NotFoundError('Zone not found');
  return toZoneDTO(row);
}
