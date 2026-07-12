import { z } from 'zod';

export const adminProductDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  basePrice: z.number().int(),
  price: z.number().int(),
  compareAtPrice: z.number().int().optional(),
  description: z.string(),
  images: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number().int(),
  inStock: z.boolean(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']),
  stockQty: z.number().int(),
  slug: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type AdminProductDTO = z.infer<typeof adminProductDtoSchema>;

export const adminProductWriteSchema = z.object({
  name: z.string().trim().min(2),
  categorySlug: z.string().min(1),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  description: z.string().trim().min(10),
  images: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  stockQty: z.number().int().min(0).optional(),
});

export type AdminProductWrite = z.infer<typeof adminProductWriteSchema>;

export const adminCategoryDtoSchema = z.object({
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  seoDescription: z.string(),
  sortOrder: z.number().int(),
});

export type AdminCategoryDTO = z.infer<typeof adminCategoryDtoSchema>;

export const adminCategoryWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case slug'),
  name: z.string().trim().min(2),
  image: z.string().optional(),
  seoDescription: z.string().trim().min(10),
  sortOrder: z.number().int().min(0).optional(),
});

export type AdminCategoryWrite = z.infer<typeof adminCategoryWriteSchema>;

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
