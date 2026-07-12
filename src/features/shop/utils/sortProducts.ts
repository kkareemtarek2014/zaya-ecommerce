import type { Product } from '@/shared/types/product.types';
import { getSellPrice } from '@/shared/utils/price';

export type SortKey =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'best-selling';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'best-selling', label: 'Best Selling' },
];

export const DEFAULT_SORT: SortKey = 'featured';

const isBestSeller = (p: Product) => (p.tags?.includes('best seller') ? 1 : 0);

/**
 * Pure, side-effect-free product sorter. Sorts on the *selling* price
 * (getSellPrice) so ordering matches what the customer sees. Returns a new
 * array — never mutates the input.
 */
export function sortProducts(products: Product[], sortBy: SortKey): Product[] {
  const list = [...products];

  switch (sortBy) {
    case 'price-asc':
      return list.sort(
        (a, b) => getSellPrice(a.basePrice) - getSellPrice(b.basePrice),
      );
    case 'price-desc':
      return list.sort(
        (a, b) => getSellPrice(b.basePrice) - getSellPrice(a.basePrice),
      );
    case 'newest':
      // No createdAt field yet — later products in the data layer are newer.
      return list.sort((a, b) =>
        b.id.localeCompare(a.id, undefined, { numeric: true }),
      );
    case 'best-selling':
      return list.sort((a, b) => isBestSeller(b) - isBestSeller(a));
    case 'featured':
    default:
      return list;
  }
}
