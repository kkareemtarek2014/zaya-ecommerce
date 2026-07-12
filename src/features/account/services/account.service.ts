import { api } from '@/shared/lib/api-client';
import type {
  CreateAddressInput,
  FavoritesDTO,
  ProfileDTO,
  SavedAddressDTO,
  UpdateFavoritesInput,
  UpdateProfileInput,
  WalletDTO,
} from '@/shared/contracts/account.contract';

export const accountService = {
  getProfile(): Promise<ProfileDTO> {
    return api.get<ProfileDTO>('/api/account/profile');
  },

  updateProfile(input: UpdateProfileInput): Promise<ProfileDTO> {
    return api.put<ProfileDTO>('/api/account/profile', input);
  },

  listAddresses(): Promise<SavedAddressDTO[]> {
    return api.get<SavedAddressDTO[]>('/api/account/addresses');
  },

  addAddress(input: CreateAddressInput): Promise<SavedAddressDTO> {
    return api.post<SavedAddressDTO>('/api/account/addresses', input);
  },

  removeAddress(id: string): Promise<{ ok: true }> {
    return api.del<{ ok: true }>(
      `/api/account/addresses/${encodeURIComponent(id)}`,
    );
  },

  getFavorites(): Promise<FavoritesDTO> {
    return api.get<FavoritesDTO>('/api/account/favorites');
  },

  putFavorites(input: UpdateFavoritesInput): Promise<FavoritesDTO> {
    return api.put<FavoritesDTO>('/api/account/favorites', input);
  },

  getWallet(): Promise<WalletDTO> {
    return api.get<WalletDTO>('/api/account/wallet');
  },
};
