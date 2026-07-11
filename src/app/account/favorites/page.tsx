import type { Metadata } from 'next';
import { FavoritesGrid } from '@/features/account';

export const metadata: Metadata = { title: 'Favorites' };

export default function FavoritesPage() {
  return <FavoritesGrid />;
}
