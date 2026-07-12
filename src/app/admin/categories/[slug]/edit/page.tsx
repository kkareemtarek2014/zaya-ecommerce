'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminBreadcrumbs,
  CategoryForm,
  useAdminCategories,
  useUpdateAdminCategory,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useAdminCategories();
  const category = categories.find((c) => c.slug === slug);
  const updateMutation = useUpdateAdminCategory(slug);

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: category?.name ?? slug },
        ]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Edit category
      </h1>
      <p className="mt-1 mb-6 text-sm text-text-secondary">
        Slug cannot change. Image uploads go to R2.
      </p>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : !category ? (
        <p className="text-sm text-status-error">Category not found.</p>
      ) : (
        <CategoryForm
          key={category.slug}
          initial={category}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync({
                name: values.name,
                seoDescription: values.seoDescription,
                sortOrder: values.sortOrder,
                image: values.image,
              });
              toast('Category saved', 'success');
              router.push('/admin/categories');
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Save failed',
                'error',
              );
            }
          }}
        />
      )}
    </div>
  );
}
