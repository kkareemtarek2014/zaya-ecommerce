'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  MapPin,
  Ticket,
  Heart,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/promos', label: 'Promos', icon: Ticket },
  { href: '/admin/bridal', label: 'Bridal', icon: Heart },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

function navActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-raised transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            href="/admin"
            className="font-(family-name:--font-display) text-xl font-bold italic text-brand-primary"
            onClick={onClose}
          >
            Zaya Admin
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            className="text-text-muted lg:hidden"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = navActive(pathname, item.href, 'exact' in item && item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-(--radius) px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-brand-blush text-brand-primary font-medium'
                    : 'text-text-secondary hover:bg-brand-blush/50 hover:text-text-primary',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
      <button
        type="button"
        aria-label="Open menu"
        className="text-text-primary lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </button>
      <div className="flex-1" />
      <p className="hidden text-sm text-text-secondary sm:block">
        {user?.name ?? user?.email}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Sign out"
        isLoading={logout.isPending}
        onClick={() => {
          logout.mutate(undefined, {
            onSuccess: () => router.replace('/admin/login'),
          });
        }}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}

export function AdminBreadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-brand-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bare = pathname === '/admin/login' || pathname === '/admin/forbidden';

  if (bare) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
