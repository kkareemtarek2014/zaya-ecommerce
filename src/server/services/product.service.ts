import 'server-only';
import type { CategoryDTO, ProductDTO } from '@/shared/contracts/product.contract';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError } from '@/server/http/errors';
import * as categoriesRepo from '@/server/repositories/categories.repo';
import * as governoratesRepo from '@/server/repositories/governorates.repo';
import * as productsRepo from '@/server/repositories/products.repo';
import type { ProductRow } from '@/server/repositories/products.repo';
import { computeSellPrice } from '@/server/services/pricing.service';

/** Maps a DB row → public ProductDTO. Never exposes basePrice. */
export function toProductDTO(row: ProductRow): ProductDTO {
  const dto: ProductDTO = {
    id: row.id,
    name: row.name,
    category: row.categorySlug,
    price: computeSellPrice(row.basePrice),
    description: row.description,
    images: row.images,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: row.inStock,
  };
  if (row.compareAtPrice != null) dto.compareAtPrice = row.compareAtPrice;
  if (row.featured) dto.featured = true;
  if (row.tags?.length) dto.tags = row.tags;
  return dto;
}

function toCategoryDTO(row: categoriesRepo.CategoryRow): CategoryDTO {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image,
    seoDescription: row.seoDescription,
  };
}

export type ListProductsInput = {
  category?: string;
  featured?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  q?: string;
};

export async function listProducts(input: ListProductsInput = {}): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const rows = await productsRepo.findProducts(db, {
    category: input.category,
    featured: input.featured,
    sort: input.sort,
    q: input.q,
  });
  let dtos = rows.map(toProductDTO);

  // Client-side sort keys (featured / best-selling) are applied in the shop UI.
  // When API sort is price-*, basePrice order ≈ sell-price order (same margin).
  if (input.q?.trim() && !input.sort) {
    dtos = dtos.slice(0, 8);
  }
  return dtos;
}

export async function getProduct(id: string): Promise<ProductDTO> {
  const db = await getRequestDb();
  const row = await productsRepo.findProductById(db, id);
  if (!row) throw new NotFoundError('Product not found');
  return toProductDTO(row);
}

export async function getProductOrNull(id: string): Promise<ProductDTO | null> {
  const db = await getRequestDb();
  const row = await productsRepo.findProductById(db, id);
  return row ? toProductDTO(row) : null;
}

export async function getRelated(
  id: string,
  limit = 4,
): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const row = await productsRepo.findProductById(db, id);
  if (!row) throw new NotFoundError('Product not found');
  const related = await productsRepo.findRelatedProducts(
    db,
    id,
    row.categorySlug,
    limit,
  );
  return related.map(toProductDTO);
}

export async function getNewArrivals(limit = 8): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const rows = await productsRepo.findNewArrivals(db, limit);
  return rows.map(toProductDTO);
}

export async function searchProducts(query: string): Promise<ProductDTO[]> {
  const db = await getRequestDb();
  const rows = await productsRepo.searchProducts(db, query, 8);
  return rows.map(toProductDTO);
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const db = await getRequestDb();
  const rows = await categoriesRepo.findAllCategories(db);
  return rows.map(toCategoryDTO);
}

export async function getCategoryOrNull(slug: string): Promise<CategoryDTO | null> {
  const db = await getRequestDb();
  const row = await categoriesRepo.findCategoryBySlug(db, slug);
  return row ? toCategoryDTO(row) : null;
}

export async function listGovernorates() {
  const db = await getRequestDb();
  return governoratesRepo.findAllGovernorates(db);
}
