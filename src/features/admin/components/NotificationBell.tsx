'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { adminOpsService } from '../services/admin-ops.service';

const POLL_MS = 30_000;

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminOpsService.listNotifications(),
    refetchInterval: POLL_MS,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => adminOpsService.markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => adminOpsService.markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const unread = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className="relative inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-status-error text-[10px] font-medium text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-(--radius-lg) border border-border bg-surface-raised shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-text-primary">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-brand-primary hover:underline"
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-text-muted">
                No notifications yet.
              </li>
            ) : (
              items.map((n) => {
                const content = (
                  <>
                    <p
                      className={cn(
                        'text-sm',
                        n.read ? 'text-text-secondary' : 'font-medium text-text-primary',
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{n.body}</p>
                    <time className="mt-1 block text-[10px] text-text-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </time>
                  </>
                );
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'border-b border-border/60 last:border-0',
                      !n.read && 'bg-brand-blush/20',
                    )}
                  >
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="block px-3 py-2.5 hover:bg-brand-blush/40"
                        onClick={() => {
                          if (!n.read) markRead.mutate(n.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-brand-blush/40"
                        onClick={() => {
                          if (!n.read) markRead.mutate(n.id);
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
