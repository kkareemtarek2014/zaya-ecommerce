'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import {
  AdminBreadcrumbs,
  ProductForm,
  StockPanel,
  useAdminCategories,
  useAdminProduct,
  useDuplicateAdminProduct,
  useUpdateAdminProduct,
} from '@/features/admin';
import { Button, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: product, isLoading, isError } = useAdminProduct(id);
  const { data: categories = [] } = useAdminCategories();
  const updateMutation = useUpdateAdminProduct(id);
  const duplicateMutation = useDuplicateAdminProduct();

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
          { label: product?.name ?? 'Edit' },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
            Edit product
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Cost stays admin-only; sell price is derived from margin.
          </p>
        </div>
        {product ? (
          <Button
            type="button"
            variant="outline"
            isLoading={duplicateMutation.isPending}
            onClick={() => {
              duplicateMutation.mutate(id, {
                onSuccess: (created) => {
                  toast('Draft duplicate created', 'success');
                  router.push(`/admin/products/${created.id}/edit`);
                },
                onError: (err) => {
                  toast(
                    err instanceof AppError
                      ? err.message
                      : 'Could not duplicate',
                    'error',
                  );
                },
              });
            }}
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : isError || !product ? (
        <p className="text-sm text-status-error">Product not found.</p>
      ) : (
        <>
          <ProductForm
            key={product.id}
            categories={categories}
            initial={product}
            isLoading={updateMutation.isPending}
            onSubmit={async (values) => {
              try {
                await updateMutation.mutateAsync({
                  ...values,
                  images: values.images,
                });
                toast('Product saved', 'success');
                router.push('/admin/products');
              } catch (err) {
                toast(
                  err instanceof AppError ? err.message : 'Save failed',
                  'error',
                );
              }
            }}
          />
          <StockPanel product={product} />
        </>
      )}
    </div>
  );
}
