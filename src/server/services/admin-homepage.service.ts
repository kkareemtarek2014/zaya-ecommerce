import 'server-only';
import {
  configSchemaForType,
  homepageBlockUpdateSchema,
  homepageBlockWriteSchema,
  homepageReorderSchema,
  type HomepageBlockDTO,
  type HomepageBlockType,
} from '@/shared/contracts/homepage.contract';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError, ValidationError } from '@/server/http/errors';
import * as repo from '@/server/repositories/homepage-blocks.repo';
import type { HomepageBlockRow } from '@/server/repositories/homepage-blocks.repo';

function toDTO(row: HomepageBlockRow): HomepageBlockDTO {
  return {
    id: row.id,
    type: row.type,
    position: row.position,
    config: row.config ?? {},
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

function parseConfig(
  type: HomepageBlockType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const schema = configSchemaForType(type);
  const parsed = schema.safeParse(config);
  if (!parsed.success) {
    throw new ValidationError('Invalid block config', parsed.error.flatten());
  }
  return parsed.data as Record<string, unknown>;
}

export async function listActiveHomepageBlocks(): Promise<HomepageBlockDTO[]> {
  const db = await getRequestDb();
  const rows = await repo.findActiveHomepageBlocks(db);
  return rows.map(toDTO);
}

export async function listAdminHomepageBlocks(): Promise<HomepageBlockDTO[]> {
  const db = await getRequestDb();
  const rows = await repo.findAllHomepageBlocks(db);
  return rows.map(toDTO);
}

export async function getAdminHomepageBlock(
  id: string,
): Promise<HomepageBlockDTO> {
  const db = await getRequestDb();
  const row = await repo.findHomepageBlockById(db, id);
  if (!row) throw new NotFoundError('Homepage block not found');
  return toDTO(row);
}

export async function createHomepageBlock(
  raw: unknown,
): Promise<HomepageBlockDTO> {
  const parsed = homepageBlockWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const config = parseConfig(parsed.data.type, parsed.data.config);
  const db = await getRequestDb();
  const maxPos = await repo.maxHomepageBlockPosition(db);
  const position = parsed.data.position ?? maxPos + 1;
  const id = `hb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

  const row = await repo.insertHomepageBlock(db, {
    id,
    type: parsed.data.type,
    position,
    config,
    active: parsed.data.active ?? true,
    createdAt: new Date(),
  });
  return toDTO(row);
}

export async function updateHomepageBlock(
  id: string,
  raw: unknown,
): Promise<HomepageBlockDTO> {
  const parsed = homepageBlockUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (Object.keys(parsed.data).length === 0) {
    throw new ValidationError('No fields to update');
  }

  const db = await getRequestDb();
  const existing = await repo.findHomepageBlockById(db, id);
  if (!existing) throw new NotFoundError('Homepage block not found');

  const nextType = (parsed.data.type ?? existing.type) as HomepageBlockType;
  let nextConfig = existing.config ?? {};
  if (parsed.data.config !== undefined || parsed.data.type !== undefined) {
    nextConfig = parseConfig(
      nextType,
      (parsed.data.config ?? existing.config ?? {}) as Record<string, unknown>,
    );
  }

  const row = await repo.updateHomepageBlock(db, id, {
    type: parsed.data.type,
    config: parsed.data.config !== undefined || parsed.data.type !== undefined
      ? nextConfig
      : undefined,
    active: parsed.data.active,
    position: parsed.data.position,
  });
  if (!row) throw new NotFoundError('Homepage block not found');
  return toDTO(row);
}

export async function deleteHomepageBlock(
  id: string,
): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const deleted = await repo.deleteHomepageBlock(db, id);
  if (!deleted) throw new NotFoundError('Homepage block not found');
  return { ok: true };
}

export async function reorderHomepageBlocks(
  raw: unknown,
): Promise<HomepageBlockDTO[]> {
  const parsed = homepageReorderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const existing = await repo.findAllHomepageBlocks(db);
  const existingIds = new Set(existing.map((r) => r.id));
  for (const id of parsed.data.ids) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`Unknown block id: ${id}`);
    }
  }
  if (parsed.data.ids.length !== existing.length) {
    throw new ValidationError('Reorder must include every block id');
  }

  const rows = await repo.reorderHomepageBlocks(db, parsed.data.ids);
  return rows.map(toDTO);
}
