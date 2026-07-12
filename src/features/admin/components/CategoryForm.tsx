'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/shared/components/ui';
import type { AdminCategoryDTO } from '@/shared/contracts/admin-catalog.contract';
import { ImageUploader } from './ImageUploader';
import { adminCatalogService } from '../services/admin-catalog.service';

const formSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case slug'),
  name: z.string().trim().min(2),
  seoDescription: z.string().trim().min(10),
  sortOrder: z.number().int().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export interface CategoryFormSubmit {
  slug?: string;
  name: string;
  seoDescription: string;
  sortOrder: number;
  image?: string;
}

interface CategoryFormProps {
  initial?: AdminCategoryDTO;
  onSubmit: (values: CategoryFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryForm({
  initial,
  onSubmit,
  isLoading,
}: CategoryFormProps) {
  const [imageList, setImageList] = useState<string[]>(
    initial?.image ? [initial.image] : [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      slug: initial?.slug ?? '',
      name: initial?.name ?? '',
      seoDescription: initial?.seoDescription ?? '',
      sortOrder: initial?.sortOrder ?? 0,
    },
  });

  return (
    <form
      className="max-w-xl space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...(initial ? {} : { slug: values.slug }),
          name: values.name,
          seoDescription: values.seoDescription,
          sortOrder: values.sortOrder,
          ...(imageList[0] ? { image: imageList[0] } : {}),
        });
      })}
    >
      {!initial ? (
        <Input
          label="Slug"
          placeholder="e.g. jewelry"
          error={errors.slug?.message}
          {...register('slug')}
        />
      ) : (
        <input type="hidden" {...register('slug')} />
      )}
      <Input label="Name" error={errors.name?.message} {...register('name')} />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="category-seo"
          className="text-sm font-medium text-text-secondary"
        >
          SEO description
        </label>
        <textarea
          id="category-seo"
          rows={3}
          className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
          {...register('seoDescription')}
        />
        {errors.seoDescription ? (
          <p className="text-xs text-status-error">
            {errors.seoDescription.message}
          </p>
        ) : null}
      </div>
      <Input
        label="Sort order"
        type="number"
        error={errors.sortOrder?.message}
        {...register('sortOrder', { valueAsNumber: true })}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">Image</p>
        <ImageUploader
          images={imageList}
          multiple={false}
          onChange={(next) => setImageList(next)}
          onUploadFiles={
            initial
              ? async (files) => {
                  const file = files[0];
                  if (!file) return [];
                  const updated = await adminCatalogService.uploadCategoryImage(
                    initial.slug,
                    file,
                  );
                  return [updated.image];
                }
              : undefined
          }
        />
        {!initial ? (
          <p className="mt-1 text-xs text-text-muted">
            Optional on create (placeholder used). Upload on the edit page.
          </p>
        ) : null}
      </div>

      <Button type="submit" isLoading={isLoading}>
        {initial ? 'Save changes' : 'Create category'}
      </Button>
    </form>
  );
}
