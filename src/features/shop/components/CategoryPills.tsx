'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/shared/data/categories.data';
import { cn } from '@/shared/utils/cn';

export function CategoryPills({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Product categories"
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
    >
      <Pill href="/shop" label="All" isActive={!active} />
      {CATEGORIES.map((cat) => (
        <Pill
          key={cat.slug}
          href={`/shop/${cat.slug}`}
          label={cat.name}
          isActive={active === cat.slug}
        />
      ))}
    </nav>
  );
}

function Pill({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors',
        isActive
          ? 'border-brand-primary bg-brand-primary text-text-inverse'
          : 'border-border bg-surface-raised text-text-secondary hover:border-brand-primary hover:text-brand-primary',
      )}
    >
      {label}
    </Link>
  );
}
