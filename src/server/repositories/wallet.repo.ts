import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { walletTransactions } from '@/server/db/schema';

export type WalletTxnRow = typeof walletTransactions.$inferSelect;

export async function listWalletTransactions(
  db: Db,
  userId: string,
): Promise<WalletTxnRow[]> {
  return db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt));
}

export function computeWalletBalance(rows: WalletTxnRow[]): number {
  return rows.reduce((sum, row) => {
    return row.type === 'credit' ? sum + row.amount : sum - row.amount;
  }, 0);
}
