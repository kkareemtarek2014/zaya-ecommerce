import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/shared/components/ui';

export const metadata: Metadata = { title: 'Access denied' };

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <p className="font-(family-name:--font-display) text-6xl font-semibold text-brand-primary">
        403
      </p>
      <h1 className="text-xl font-semibold text-text-primary">Access denied</h1>
      <p className="max-w-md text-sm text-text-secondary">
        Your account does not have permission to view the admin dashboard.
      </p>
      <div className="mt-2 flex gap-2">
        <Link href="/">
          <Button variant="outline">Storefront</Button>
        </Link>
        <Link href="/admin/login">
          <Button>Admin login</Button>
        </Link>
      </div>
    </div>
  );
}
