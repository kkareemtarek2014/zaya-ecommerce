'use client';

/**
 * Favorites are now a shared concern (used by shop cards, product detail and
 * this account page). The store lives in `@/shared/store/favorites.store`.
 * Re-exported here so existing account imports keep working.
 */
export {
  useFavoritesStore,
  selectFavoritesCount,
} from '@/shared/store/favorites.store';
