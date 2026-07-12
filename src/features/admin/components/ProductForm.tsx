'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '@/shared/components/ui';
import type { AdminCategoryDTO, AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { ImageUploader } from './ImageUploader';
import { adminCatalogService } from '../services/admin-catalog.service';

const formSchema = z.object({
  name: z.string().trim().min(2),
  categorySlug: z.string().min(1),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  description: z.string().trim().min(10),
  inStock: z.boolean(),
  featured: z.boolean(),
  stockQty: z.number().int().min(0),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface ProductFormSubmit {
  name: string;
  categorySlug: string;
  basePrice: number;
  compareAtPrice?: number | null;
  description: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
  tags?: string[];
  stockQty: number;
}

interface ProductFormProps {
  categories: AdminCategoryDTO[];
  initial?: AdminProductDTO;
  onSubmit: (values: ProductFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({
  categories,
  initial,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const [imageList, setImageList] = useState<string[]>(initial?.images ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? '',
      categorySlug: initial?.category ?? categories[0]?.slug ?? '',
      basePrice: initial?.basePrice ?? 100,
      compareAtPrice: initial?.compareAtPrice ?? null,
      description: initial?.description ?? '',
      inStock: initial?.inStock ?? true,
      featured: initial?.featured ?? false,
      stockQty: initial?.stockQty ?? 50,
      tags: initial?.tags?.join(', ') ?? '',
    },
  });

  return (
    <form
      className="max-w-xl space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        const tags = values.tags
          ? values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined;
        await onSubmit({
          name: values.name,
          categorySlug: values.categorySlug,
          basePrice: values.basePrice,
          compareAtPrice: values.compareAtPrice ?? null,
          description: values.description,
          images: imageList,
          inStock: values.inStock,
          featured: values.featured,
          stockQty: values.stockQty,
          tags,
        });
      })}
    >
      <Input label="Name" error={errors.name?.message} {...register('name')} />
      <Select
        label="Category"
        error={errors.categorySlug?.message}
        {...register('categorySlug')}
      >
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Base price (EGP cost)"
          type="number"
          error={errors.basePrice?.message}
          {...register('basePrice', { valueAsNumber: true })}
        />
        <Input
          label="Compare-at price (optional)"
          type="number"
          error={errors.compareAtPrice?.message}
          {...register('compareAtPrice', {
            setValueAs: (v: unknown) => {
              if (v === '' || v == null) return null;
              const n = typeof v === 'number' ? v : Number(v);
              return Number.isFinite(n) ? n : null;
            },
          })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="product-desc"
          className="text-sm font-medium text-text-secondary"
        >
          Description
        </label>
        <textarea
          id="product-desc"
          rows={4}
          className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
          {...register('description')}
        />
        {errors.description ? (
          <p className="text-xs text-status-error">{errors.description.message}</p>
        ) : null}
      </div>
      <Input label="Tags (comma-separated)" {...register('tags')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Stock qty"
          type="number"
          error={errors.stockQty?.message}
          {...register('stockQty', { valueAsNumber: true })}
        />
        <div className="flex flex-col gap-3 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('inStock')} />
            In stock
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} />
            Featured
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">Images</p>
        <ImageUploader
          images={imageList}
          onChange={async (next) => {
            if (initial) {
              const removed = imageList.filter((u) => !next.includes(u));
              for (const url of removed) {
                await adminCatalogService.removeProductImage(initial.id, url);
              }
            }
            setImageList(next);
          }}
          onUploadFiles={
            initial
              ? async (files) => {
                  const before = new Set(imageList);
                  const updated = await adminCatalogService.uploadProductImages(
                    initial.id,
                    files,
                  );
                  return updated.images.filter((u) => !before.has(u));
                }
              : undefined
          }
        />
        {!initial ? (
          <p className="mt-1 text-xs text-text-muted">
            Save the product first, then upload images on the edit page.
          </p>
        ) : null}
      </div>

      <Button type="submit" isLoading={isLoading}>
        {initial ? 'Save changes' : 'Create product'}
      </Button>
    </form>
  );
}
