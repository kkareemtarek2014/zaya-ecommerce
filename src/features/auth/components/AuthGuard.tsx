'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { Loader } from '@/shared/components/ui/Loader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthEnabled = useFeature('auth');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (isAuthEnabled && hydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthEnabled, hydrated, isAuthenticated, router]);

  // Wait for the persisted auth store to hydrate before deciding.
  if (!hydrated) {
    return <Loader fullscreen={false} className="p-12" />;
  }

  // Auth on + not signed in: render nothing while the redirect above runs,
  // to avoid flashing protected content.
  if (isAuthEnabled && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
