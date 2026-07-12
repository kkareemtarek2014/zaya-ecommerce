'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_USERS, type User } from '@/shared/data/users.data';

/**
 * Persisted registry of mock users (seed + anyone who registers). Keeps the
 * static auth layer internally consistent across reloads. Replaced by the
 * backend later — only `auth.service` reads/writes this.
 */
interface UsersState {
  users: User[];
  addUser: (user: User) => void;
  findByEmail: (email: string) => User | undefined;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      findByEmail: (email) =>
        get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        ),
    }),
    { name: 'Zaya-users' },
  ),
);
