import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Under maintenance',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-brand-blush/40 to-surface px-6 text-center">
      <p className="font-(family-name:--font-display) text-4xl font-semibold text-brand-primary">
        {SITE.name}
      </p>
      <h1 className="mt-6 font-(family-name:--font-display) text-2xl font-semibold text-text-primary sm:text-3xl">
        We&apos;ll be back soon
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
        The storefront is temporarily closed for maintenance. Please check back
        shortly.
      </p>
      <Link
        href="/admin/login"
        className="mt-10 text-xs text-text-muted underline-offset-2 hover:text-brand-primary hover:underline"
      >
        Admin sign in
      </Link>
    </main>
  );
}
