import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string; // ISO date
  description: string;
}

interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
}

// Pre-seeded with a dummy balance and some history for the mock
const INITIAL_STATE: WalletState = {
  balance: 350,
  transactions: [
    {
      id: 'txn_1',
      type: 'credit',
      amount: 500,
      date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      description: 'Refund for Order #ZN-9921',
    },
    {
      id: 'txn_2',
      type: 'debit',
      amount: 150,
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      description: 'Payment for Order #ZN-1044',
    },
  ],
};

export const useWalletStore = create<WalletState>()(
  persist(
    () => INITIAL_STATE,
    {
      name: 'Zaya-wallet',
    }
  )
);
