'use client';

import Link from 'next/link';
import type { AdminActivityItem } from '@/shared/contracts/admin-ops-activity.contract';

export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity.',
}: {
  items: AdminActivityItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const body = (
          <>
            <p className="text-sm text-text-primary">{item.summary}</p>
            <time className="mt-0.5 block text-xs text-text-muted">
              {new Date(item.createdAt).toLocaleString()}
            </time>
          </>
        );
        return (
          <li key={item.id} className="py-2.5">
            {item.href ? (
              <Link
                href={item.href}
                className="block hover:text-brand-primary"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
