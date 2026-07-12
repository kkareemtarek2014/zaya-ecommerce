import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccountNav } from '@/features/account';
import { AuthGuard } from '@/features/auth';

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
        <h1 className="font-display text-3xl font-semibold lg:text-4xl">
          My Account
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
