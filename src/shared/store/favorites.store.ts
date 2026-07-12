'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wishlist / favorites store.
 * Shared because it is consumed by 2+ features (shop cards, product detail,
 * and the account favorites page). Front-end only for now (persisted to
 * localStorage). When a backend exists, sync `ids` through a service.
 */
interface FavoritesState {
  ids: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      add: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids
            : [...state.ids, productId],
        })),
      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
        })),
      isFavorite: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: 'Zaya-favorites' },
  ),
);

/** Selector: total number of saved items. */
export const selectFavoritesCount = (state: FavoritesState): number =>
  state.ids.length;
