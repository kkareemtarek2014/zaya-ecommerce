'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/shared/data/categories.data';
import { cn } from '@/shared/utils/cn';

export function CategoryPills({ active }: { active?: string }) {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';

  return (
    <nav
      aria-label="Product categories"
      className={cn(
        'no-scrollbar flex snap-x snap-proximity gap-2 overflow-x-auto pb-1',
        '[mask-image:linear-gradient(to_right,black_85%,transparent)]',
      )}
    >
      <Pill href={`/shop${suffix}`} label="All" isActive={!active} />
      {CATEGORIES.map((cat) => (
        <Pill
          key={cat.slug}
          href={`/shop/${cat.slug}${suffix}`}
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
        'snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors active:scale-[0.97]',
        isActive
          ? 'border-brand-primary bg-brand-primary text-text-inverse'
          : 'border-border bg-surface-raised text-text-secondary hover:border-brand-primary hover:text-brand-primary',
      )}
    >
      {label}
    </Link>
  );
}
