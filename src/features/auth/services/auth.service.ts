import type { User } from '@/shared/data/users.data';
import { useUsersStore } from '../store/users.store';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Static auth service. Reads/writes the persisted mock users store. When the
 * real backend exists (see API.md), replace ONLY these function bodies.
 */
export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay();
    const user = useUsersStore.getState().findByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    return user;
  },

  async register(email: string, name: string, password: string): Promise<User> {
    await delay();
    const store = useUsersStore.getState();
    if (store.findByEmail(email)) {
      throw new Error('An account with this email already exists');
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      password,
    };
    store.addUser(newUser);
    return newUser;
  },

  async resetPassword(email: string): Promise<void> {
    await delay();
    if (!useUsersStore.getState().findByEmail(email)) {
      throw new Error('No account found for that email');
    }
  },
};
