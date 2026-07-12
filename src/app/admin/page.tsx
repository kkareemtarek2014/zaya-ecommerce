import type { Metadata } from 'next';
import Link from 'next/link';
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
        Welcome to Zaya Admin. Manage catalog, orders, users, locations, promos,
        bridal requests, and store settings.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Products', note: 'Catalog & pricing', href: '/admin/products' },
          { title: 'Categories', note: 'Shop navigation', href: '/admin/categories' },
          { title: 'Orders', note: 'Fulfillment', href: '/admin/orders' },
          { title: 'Users', note: 'Accounts & roles', href: '/admin/users' },
          { title: 'Locations', note: 'Governorates & shipping', href: '/admin/locations' },
          { title: 'Promos', note: 'Discount codes', href: '/admin/promos' },
          { title: 'Bridal', note: 'Custom requests', href: '/admin/bridal' },
          { title: 'Settings', note: 'Margin & site meta', href: '/admin/settings' },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-(--radius-lg) border border-border bg-brand-blush/30 p-5 transition-colors hover:border-brand-primary/40"
          >
            <p className="font-medium text-brand-primary">{card.title}</p>
            <p className="mt-1 text-xs text-text-muted">{card.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
