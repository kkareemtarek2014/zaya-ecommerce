import 'server-only';
import {
  createAddressInputSchema,
  updateFavoritesInputSchema,
  updateProfileInputSchema,
  type FavoritesDTO,
  type ProfileDTO,
  type SavedAddressDTO,
  type WalletDTO,
} from '@/shared/contracts/account.contract';
import { FEATURES } from '@/config/features.config';
import { getRequestDb } from '@/server/db/request';
import {
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as addressesRepo from '@/server/repositories/addresses.repo';
import * as favoritesRepo from '@/server/repositories/favorites.repo';
import * as governoratesRepo from '@/server/repositories/governorates.repo';
import * as usersRepo from '@/server/repositories/users.repo';
import * as walletRepo from '@/server/repositories/wallet.repo';
import { products } from '@/server/db/schema';
import { inArray } from 'drizzle-orm';

function toAddressDTO(row: addressesRepo.AddressRow): SavedAddressDTO {
  return {
    id: row.id,
    label: row.label,
    governorate: row.governorateId,
    city: row.city,
    street: row.street,
  };
}

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const db = await getRequestDb();
  const user = await usersRepo.findUserById(db, userId);
  if (!user) throw new NotFoundError('User not found');
  const dto: ProfileDTO = {
    fullName: user.name,
    email: user.email,
  };
  if (user.phone) dto.phone = user.phone;
  return dto;
}

export async function updateProfile(
  userId: string,
  raw: unknown,
): Promise<ProfileDTO> {
  const parsed = updateProfileInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const user = await usersRepo.updateUserProfile(db, userId, {
    name: parsed.data.fullName,
    phone: parsed.data.phone ?? null,
  });
  const dto: ProfileDTO = {
    fullName: user.name,
    email: user.email,
  };
  if (user.phone) dto.phone = user.phone;
  return dto;
}

export async function listAddresses(userId: string): Promise<SavedAddressDTO[]> {
  const db = await getRequestDb();
  const rows = await addressesRepo.listAddressesByUser(db, userId);
  return rows.map(toAddressDTO);
}

export async function addAddress(
  userId: string,
  raw: unknown,
): Promise<SavedAddressDTO> {
  const parsed = createAddressInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const govs = await governoratesRepo.findAllGovernorates(db);
  if (!govs.some((g) => g.id === parsed.data.governorate)) {
    throw new ValidationError('Please select a valid governorate');
  }

  const id = `addr-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const row = await addressesRepo.createAddress(db, {
    id,
    userId,
    label: parsed.data.label,
    governorateId: parsed.data.governorate,
    city: parsed.data.city,
    street: parsed.data.street,
  });
  return toAddressDTO(row);
}

export async function removeAddress(
  userId: string,
  addressId: string,
): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const deleted = await addressesRepo.deleteAddressForUser(
    db,
    addressId,
    userId,
  );
  if (!deleted) throw new NotFoundError('Address not found');
  return { ok: true };
}

export async function getFavorites(userId: string): Promise<FavoritesDTO> {
  const db = await getRequestDb();
  const ids = await favoritesRepo.listFavoriteProductIds(db, userId);
  return { ids };
}

export async function putFavorites(
  userId: string,
  raw: unknown,
): Promise<FavoritesDTO> {
  const parsed = updateFavoritesInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const ids = [...new Set(parsed.data.ids)];

  if (ids.length > 0) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, ids));
    const valid = new Set(existing.map((r) => r.id));
    const filtered = ids.filter((id) => valid.has(id));
    const saved = await favoritesRepo.replaceFavorites(db, userId, filtered);
    return { ids: saved };
  }

  const saved = await favoritesRepo.replaceFavorites(db, userId, []);
  return { ids: saved };
}

export async function getWallet(userId: string): Promise<WalletDTO> {
  if (!FEATURES.wallet.enabled) {
    throw new NotFoundError('Not found');
  }
  const db = await getRequestDb();
  const rows = await walletRepo.listWalletTransactions(db, userId);
  return {
    balance: walletRepo.computeWalletBalance(rows),
    transactions: rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
