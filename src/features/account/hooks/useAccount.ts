'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateAddressInput,
  UpdateProfileInput,
} from '@/shared/contracts/account.contract';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useFavoritesStore } from '@/shared/store/favorites.store';
import { accountService } from '../services/account.service';

export const accountKeys = {
  profile: ['account', 'profile'] as const,
  addresses: ['account', 'addresses'] as const,
  favorites: ['account', 'favorites'] as const,
  wallet: ['account', 'wallet'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile,
    queryFn: () => accountService.getProfile(),
    retry: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      accountService.updateProfile(input),
    onSuccess: (profile) => {
      qc.setQueryData(accountKeys.profile, profile);
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: accountKeys.addresses,
    queryFn: () => accountService.listAddresses(),
    retry: false,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressInput) =>
      accountService.addAddress(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountKeys.addresses });
    },
  });
}

export function useRemoveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.removeAddress(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountKeys.addresses });
    },
  });
}

export function useWallet() {
  return useQuery({
    queryKey: accountKeys.wallet,
    queryFn: () => accountService.getWallet(),
    retry: false,
  });
}

/**
 * While authenticated, pull server favorites (source of truth on refresh).
 * Login/register push guest ids first (see useAuth), then this hydrates.
 */
export function useFavoritesSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const setIds = useFavoritesStore((s) => s.setIds);

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await accountService.getFavorites();
        if (!cancelled) setIds(result.ids);
      } catch {
        /* keep local ids */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionChecked, isAuthenticated, setIds]);
}

/** Persist favorites set to the server (login push + authenticated toggles). */
export async function syncFavoritesToServer(ids: string[]): Promise<string[]> {
  const result = await accountService.putFavorites({ ids });
  return result.ids;
}
