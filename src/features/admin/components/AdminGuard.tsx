'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSession } from '@/features/auth/hooks/useAuth';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { Loader } from '@/shared/components/ui/Loader';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Gates /admin/** (except login) on session + role === 'admin'.
 * Unauthenticated → /admin/login; non-admin → /admin/forbidden.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const user = useAuthStore((s) => s.user);
  useSession();

  const isLogin = pathname === '/admin/login';
  const isForbidden = pathname === '/admin/forbidden';

  useEffect(() => {
    if (!hydrated || !sessionChecked) return;
    if (isLogin) {
      if (isAuthenticated && user?.role === 'admin') {
        router.replace('/admin');
      }
      return;
    }
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname || '/admin');
      router.replace(`/admin/login?redirect=${redirect}`);
      return;
    }
    if (user?.role !== 'admin' && !isForbidden) {
      router.replace('/admin/forbidden');
    }
  }, [
    hydrated,
    sessionChecked,
    isAuthenticated,
    user?.role,
    isLogin,
    isForbidden,
    pathname,
    router,
  ]);

  if (!hydrated || !sessionChecked) {
    return <Loader fullscreen={false} className="p-12" />;
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== 'admin') {
    if (isForbidden) return <>{children}</>;
    return null;
  }

  return <>{children}</>;
}
