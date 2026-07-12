import 'server-only';
import {
  adminGovernorateUpdateSchema,
  adminGovernorateWriteSchema,
  adminShippingZoneFeeSchema,
  type ShippingZoneDTO,
} from '@/shared/contracts/admin-config.contract';
import type { GovernorateDTO } from '@/shared/contracts/product.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as govRepo from '@/server/repositories/governorates.repo';

function toGovDTO(row: govRepo.GovernorateRow): GovernorateDTO {
  return { id: row.id, name: row.name, zone: row.zone };
}

function toZoneDTO(row: govRepo.ShippingZoneRow): ShippingZoneDTO {
  return { zone: row.zone, label: row.label, fee: row.fee };
}

export async function listAdminGovernorates(): Promise<GovernorateDTO[]> {
  const db = await getRequestDb();
  const rows = await govRepo.findAllGovernorates(db);
  return rows.map(toGovDTO);
}

export async function createAdminGovernorate(
  raw: unknown,
): Promise<GovernorateDTO> {
  const parsed = adminGovernorateWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await govRepo.findGovernorateById(db, parsed.data.id);
  if (existing) throw new ConflictError('Governorate id already exists');

  const zone = await govRepo.findShippingZone(db, parsed.data.zone);
  if (!zone) throw new ValidationError('Invalid shipping zone');

  const row = await govRepo.insertGovernorate(db, parsed.data);
  return toGovDTO(row);
}

export async function updateAdminGovernorate(
  id: string,
  raw: unknown,
): Promise<GovernorateDTO> {
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

  const row = await govRepo.updateGovernorate(db, id, parsed.data);
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
      'Cannot delete governorate used by orders or addresses',
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
  if (zone !== 'cairo_giza' && zone !== 'near' && zone !== 'far') {
    throw new ValidationError('Invalid shipping zone');
  }
  const parsed = adminShippingZoneFeeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await govRepo.findShippingZone(db, zone);
  if (!existing) throw new NotFoundError('Shipping zone not found');

  const row = await govRepo.updateShippingZoneFee(db, zone, parsed.data.fee);
  if (!row) throw new NotFoundError('Shipping zone not found');
  return toZoneDTO(row);
}
