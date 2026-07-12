import type { Metadata } from 'next';
import { AdminBreadcrumbs } from '@/features/admin';

export const metadata: Metadata = { title: 'Dashboard' };

export default function AdminHomePage() {
  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]} />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Dashboard
      </h1>
      <p className="mt-2 max-w-xl text-sm text-text-secondary">
        Welcome to Zaya Admin. Products and categories are live — use the
        sidebar. Orders, settings, and stats follow in later phases.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Products', note: 'Ready', href: '/admin/products' },
          { title: 'Categories', note: 'Ready', href: '/admin/categories' },
          { title: 'Orders', note: 'Phase 10' },
          { title: 'Settings', note: 'Phase 11' },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-(--radius-lg) border border-dashed border-border bg-brand-blush/30 p-5"
          >
            {'href' in card && card.href ? (
              <a
                href={card.href}
                className="font-medium text-brand-primary hover:underline"
              >
                {card.title}
              </a>
            ) : (
              <p className="font-medium text-text-primary">{card.title}</p>
            )}
            <p className="mt-1 text-xs text-text-muted">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
