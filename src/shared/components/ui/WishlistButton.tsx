'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useFavoritesStore } from '@/shared/store/favorites.store';

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
  const active = hydrated && ids.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        'group/heart flex items-center justify-center transition-colors',
        variant === 'icon' &&
          'size-9 rounded-full bg-surface-raised/85 text-text-secondary shadow-sm backdrop-blur-sm hover:text-brand-primary',
        variant === 'inline' && 'text-text-secondary hover:text-brand-primary',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-[18px] transition-all',
          active
            ? 'animate-pop fill-brand-primary text-brand-primary'
            : 'fill-transparent',
        )}
      />
    </button>
  );
}
