'use client';

import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useWalletStore } from '../store/wallet.store';

export function MyWallet() {
  const mounted = useHydrated();
  const { balance, transactions } = useWalletStore();

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-blush to-surface-primary p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-primary text-brand-primary shadow-sm">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Current Balance</p>
            <p className="font-(family-name:--font-display) text-4xl font-semibold text-text-primary">
              {formatEGP(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-(family-name:--font-display) text-xl font-semibold mb-4">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-text-secondary">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface-raised overflow-hidden">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${txn.type === 'credit' ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}>
                    {txn.type === 'credit' ? <ArrowDownRight className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{txn.description}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(txn.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-status-success' : 'text-text-primary'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatEGP(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
