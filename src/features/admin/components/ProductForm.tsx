'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '@/shared/components/ui';
import type {
  AdminCategoryDTO,
  AdminProductDTO,
  ProductStatus,
} from '@/shared/contracts/admin-catalog.contract';
import { ImageUploader } from './ImageUploader';
import { MediaPicker } from './MediaPicker';
import { adminCatalogService } from '../services/admin-catalog.service';

const formSchema = z.object({
  name: z.string().trim().min(2),
  categorySlug: z.string().min(1),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  basePriceUsd: z.number().positive().nullable().optional(),
  fulfilmentType: z.enum(['local_stock', 'dropship']),
  preorderEnabled: z.boolean(),
  preorderEtaDays: z.number().int().min(1).max(120).nullable().optional(),
  description: z.string().trim().min(10),
  inStock: z.boolean(),
  featured: z.boolean(),
  stockQty: z.number().int().min(0),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']),
  slug: z.string().optional(),
  sku: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  descriptionFormat: z.enum(['plain', 'html']),
});

type FormValues = z.infer<typeof formSchema>;

export interface ProductFormSubmit {
  name: string;
  categorySlug: string;
  basePrice: number;
  compareAtPrice?: number | null;
  basePriceUsd?: number | null;
  fulfilmentType?: 'local_stock' | 'dropship';
  preorderEnabled?: boolean;
  preorderEtaDays?: number | null;
  description: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
  tags?: string[];
  stockQty: number;
  status: ProductStatus;
  slug?: string | null;
  sku?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  descriptionFormat?: 'plain' | 'html';
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
  const [mediaOpen, setMediaOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? '',
      categorySlug: initial?.category ?? categories[0]?.slug ?? '',
      basePrice: initial?.basePrice ?? 100,
      compareAtPrice: initial?.compareAtPrice ?? null,
      basePriceUsd: initial?.basePriceUsd ?? null,
      fulfilmentType: initial?.fulfilmentType ?? 'local_stock',
      preorderEnabled: initial?.preorderEnabled ?? false,
      preorderEtaDays: initial?.preorderEtaDays ?? null,
      description: initial?.description ?? '',
      inStock: initial?.inStock ?? true,
      featured: initial?.featured ?? false,
      stockQty: initial?.stockQty ?? 50,
      tags: initial?.tags?.join(', ') ?? '',
      status: initial?.status ?? 'draft',
      slug: initial?.slug ?? '',
      sku: initial?.sku ?? '',
      seoTitle: initial?.seoTitle ?? '',
      seoDescription: initial?.seoDescription ?? '',
      ogImage: initial?.ogImage ?? '',
      canonicalUrl: initial?.canonicalUrl ?? '',
      descriptionFormat: initial?.descriptionFormat ?? 'plain',
    },
  });

  const descriptionFormat = watch('descriptionFormat');

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
          basePriceUsd: values.basePriceUsd ?? null,
          fulfilmentType: values.fulfilmentType,
          preorderEnabled: values.preorderEnabled,
          preorderEtaDays: values.preorderEnabled
            ? values.preorderEtaDays
            : null,
          description: values.description,
          images: imageList,
          inStock: values.inStock,
          featured: values.featured,
          stockQty: values.stockQty,
          tags,
          status: values.status,
          slug: values.slug?.trim() || null,
          sku: values.sku?.trim() || null,
          seoTitle: values.seoTitle?.trim() || null,
          seoDescription: values.seoDescription?.trim() || null,
          ogImage: values.ogImage?.trim() || null,
          canonicalUrl: values.canonicalUrl?.trim() || null,
          descriptionFormat: values.descriptionFormat,
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
      <Select
        label="Status"
        error={errors.status?.message}
        {...register('status')}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="hidden">Hidden (direct link only)</option>
        <option value="archived">Archived</option>
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Slug (optional)"
          error={errors.slug?.message}
          placeholder="auto from name"
          {...register('slug')}
        />
        <Input
          label="SKU (optional)"
          error={errors.sku?.message}
          placeholder="auto-generated"
          {...register('sku')}
        />
      </div>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Base price USD (optional)"
          type="number"
          step="0.01"
          error={errors.basePriceUsd?.message}
          {...register('basePriceUsd', {
            setValueAs: (v: unknown) => {
              if (v === '' || v == null) return null;
              const n = typeof v === 'number' ? v : Number(v);
              return Number.isFinite(n) && n > 0 ? n : null;
            },
          })}
        />
        <div className="flex flex-col justify-end gap-1 text-xs text-text-muted">
          {initial?.landedCost != null ? (
            <p>
              Landed cost snapshot:{' '}
              <span className="font-medium text-text-secondary">
                {initial.landedCost} EGP
              </span>
            </p>
          ) : (
            <p>Set USD base to use landed-cost pricing when the flag is on.</p>
          )}
        </div>
      </div>
      <Select
        label="Fulfilment type"
        error={errors.fulfilmentType?.message}
        {...register('fulfilmentType')}
      >
        <option value="local_stock">Local stock</option>
        <option value="dropship">Dropship sourcing</option>
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-text-secondary">
          <input type="checkbox" {...register('preorderEnabled')} />
          Allow pre-order when OOS
        </label>
        <Input
          label="Pre-order ETA (days)"
          type="number"
          error={errors.preorderEtaDays?.message}
          {...register('preorderEtaDays', {
            setValueAs: (v: unknown) => {
              if (v === '' || v == null) return null;
              const n = typeof v === 'number' ? v : Number(v);
              return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
            },
          })}
        />
      </div>
      {initial?.tags?.includes('temu-import') ? (
        <p className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-xs text-text-muted">
          Temu import — localize the description for Egyptian customers before
          publishing.
        </p>
      ) : null}
      {initial?.sourceProvider ? (
        <div className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-xs text-text-muted">
          <p>
            Source: {initial.sourceProvider}
            {initial.sourceProductId ? ` · ${initial.sourceProductId}` : ''}
          </p>
          {initial.sourceUrl ? (
            <p className="mt-1 truncate">
              <a
                href={initial.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-primary underline-offset-2 hover:underline"
              >
                {initial.sourceUrl}
              </a>
            </p>
          ) : null}
          <p className="mt-1">
            Source stock:{' '}
            {initial.sourceInStock == null
              ? '—'
              : initial.sourceInStock
                ? 'in stock'
                : 'OOS'}
            {initial.lastSyncedAt
              ? ` · synced ${new Date(initial.lastSyncedAt).toLocaleString()}`
              : ''}
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label
            htmlFor="product-desc"
            className="text-sm font-medium text-text-secondary"
          >
            Description
          </label>
          <Select
            label="Format"
            className="w-36"
            error={errors.descriptionFormat?.message}
            {...register('descriptionFormat')}
          >
            <option value="plain">Plain text</option>
            <option value="html">HTML</option>
          </Select>
        </div>
        <textarea
          id="product-desc"
          rows={descriptionFormat === 'html' ? 6 : 4}
          className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
          {...register('description')}
        />
        {descriptionFormat === 'html' ? (
          <p className="text-xs text-text-muted">
            Allowed tags: p, br, strong, em, ul, ol, li, a. Scripts stripped on save.
          </p>
        ) : null}
        {errors.description ? (
          <p className="text-xs text-status-error">{errors.description.message}</p>
        ) : null}
      </div>
      <Input label="Tags (comma-separated)" {...register('tags')} />
      <div className="grid gap-4 sm:grid-cols-2">
        {!initial ? (
          <Input
            label="Initial stock qty"
            type="number"
            error={errors.stockQty?.message}
            {...register('stockQty', { valueAsNumber: true })}
          />
        ) : (
          <div className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm">
            <p className="font-medium text-text-secondary">Stock</p>
            <p className="mt-1 text-text-primary">
              Available {initial.availableQty ?? initial.stockQty} · On hand{' '}
              {initial.stockQty} · Reserved {initial.reservedQty ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Use the Inventory panel below to adjust stock.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('inStock')} />
            In stock (admin override)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} />
            Featured
          </label>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-(--radius) border border-border p-4">
        <legend className="px-1 text-sm font-medium text-text-secondary">
          SEO (optional)
        </legend>
        <Input label="SEO title" {...register('seoTitle')} />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="product-seo-desc"
            className="text-sm font-medium text-text-secondary"
          >
            SEO description
          </label>
          <textarea
            id="product-seo-desc"
            rows={2}
            className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
            {...register('seoDescription')}
          />
        </div>
        <Input
          label="OG image URL"
          placeholder="Defaults to first product image"
          {...register('ogImage')}
        />
        <Input
          label="Canonical URL"
          placeholder="/product/[id]"
          {...register('canonicalUrl')}
        />
      </fieldset>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-secondary">Images</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMediaOpen(true)}
          >
            From library
          </Button>
        </div>
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
            Save the product first, then upload images on the edit page — or pick from the library.
          </p>
        ) : null}
      </div>

      <MediaPicker
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          if (!imageList.includes(url)) setImageList([...imageList, url]);
        }}
      />

      <Button type="submit" isLoading={isLoading}>
        {initial ? 'Save changes' : 'Create product'}
      </Button>
    </form>
  );
}
