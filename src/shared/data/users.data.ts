export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  /**
   * Plaintext for the static mock ONLY. When the backend exists this becomes a
   * server-side hash and never reaches the client. Do not ship this as-is.
   */
  password: string;
}

/** Seed accounts for the dummy auth layer. */
export const SEED_USERS: User[] = [
  {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '01000000000',
    password: 'password123',
  },
];
