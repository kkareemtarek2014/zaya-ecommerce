'use client';

import { useRouter } from 'next/navigation';
import {
  AdminBreadcrumbs,
  CategoryForm,
  useCreateAdminCategory,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateAdminCategory();

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'New' },
        ]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        New category
      </h1>
      <p className="mt-1 mb-6 text-sm text-text-secondary">
        Slug is permanent. Upload an image after saving.
      </p>
      <CategoryForm
        isLoading={createMutation.isPending}
        onSubmit={async (values) => {
          if (!values.slug) return;
          try {
            const cat = await createMutation.mutateAsync({
              slug: values.slug,
              name: values.name,
              seoDescription: values.seoDescription,
              sortOrder: values.sortOrder,
              image: values.image,
            });
            toast('Category created', 'success');
            router.push(`/admin/categories/${cat.slug}/edit`);
          } catch (err) {
            toast(
              err instanceof AppError ? err.message : 'Create failed',
              'error',
            );
          }
        }}
      />
    </div>
  );
}
