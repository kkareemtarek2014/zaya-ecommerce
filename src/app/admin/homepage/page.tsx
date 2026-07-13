'use client';

import { AdminBreadcrumbs, HomepageBuilder } from '@/features/admin';

export default function AdminHomepagePage() {
  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Homepage' },
        ]}
      />
      <h1 className="mb-6 font-(family-name:--font-display) text-2xl font-semibold">
        Homepage builder
      </h1>
      <HomepageBuilder />
    </div>
  );
}
