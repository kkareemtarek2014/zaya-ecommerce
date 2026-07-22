'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useFavoritesStore } from '@/shared/store/favorites.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { syncFavoritesToServer } from '@/features/account/hooks/useAccount';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  /** `icon` = round icon button (over product image). `inline` = bare heart. */
  variant?: 'icon' | 'inline';
  className?: string;
}

/**
 * Reusable wishlist (favorites) toggle. Reflects and mutates the shared
 * favorites store. Safe against hydration mismatch via useHydrated.
 * When authenticated, also PUTs the updated set to the server.
 */
export function WishlistButton({
  productId,
  productName,
  variant = 'icon',
  className,
}: WishlistButtonProps) {
  const hydrated = useHydrated();
  const toggle = useFavoritesStore((s) => s.toggle);
  const ids = useFavoritesStore((s) => s.ids);
  const setIds = useFavoritesStore((s) => s.setIds);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const active = hydrated && ids.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${productName} from wishlist`
          : `Add ${productName} to wishlist`
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
        if (isAuthenticated) {
          const next = useFavoritesStore.getState().ids;
          void syncFavoritesToServer(next)
            .then(setIds)
            .catch(() => {
              /* local optimistic state kept */
            });
        }
      }}
      className={cn(
        'group/heart flex items-center justify-center transition-colors',
        variant === 'icon' &&
          'size-11 rounded-full bg-surface-raised/85 text-text-secondary shadow-sm backdrop-blur-sm hover:text-brand-primary active:scale-[0.97] sm:size-9',
        variant === 'inline' && 'text-text-secondary hover:text-brand-primary',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-4.5 transition-all',
          active
            ? 'animate-pop fill-brand-primary text-brand-primary'
            : 'fill-transparent',
        )}
      />
    </button>
  );
}
