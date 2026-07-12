import type { CategoryDTO, ProductDTO } from '@/shared/contracts/product.contract';

export type Category = CategoryDTO;

/** Public storefront product (sell price only — never basePrice). */
export type Product = ProductDTO;

/**
 * Seed/source record with sourcing cost. Used only by `shared/data` + `db/seed`.
 * Never send this shape to the browser.
 */
export interface ProductSeed {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured?: boolean;
  tags?: string[];
}
