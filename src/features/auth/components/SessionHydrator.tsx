'use client';

import { useSession } from '../hooks/useAuth';
import { useFavoritesSync } from '@/features/account/hooks/useAccount';

/** Mount once under Providers to hydrate auth + favorites from the session cookie. */
export function SessionHydrator() {
  useSession();
  useFavoritesSync();
  return null;
}
