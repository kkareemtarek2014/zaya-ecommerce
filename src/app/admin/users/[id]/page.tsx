'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminBreadcrumbs,
  ORDER_STATUS_LABELS,
  UserForm,
  useAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from '@/features/admin';
import {
  Button,
  ConfirmDialog,
  useToast,
} from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { AppError } from '@/shared/contracts/errors';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useState } from 'react';

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const me = useAuthStore((s) => s.user);
  const { data: user, isLoading, isError } = useAdminUser(id);
  const updateMutation = useUpdateAdminUser(id);
  const deleteMutation = useDeleteAdminUser();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: user?.name ?? 'User' },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
            {user?.name ?? 'User'}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{user?.email}</p>
        </div>
        {user && user.id !== me?.id ? (
          <Button
            type="button"
            variant="outline"
            className="border-status-error text-status-error hover:bg-status-error/10"
            onClick={() => setConfirmDelete(true)}
          >
            Delete user
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading…</p>
      ) : isError || !user ? (
        <p className="mt-6 text-sm text-status-error">User not found.</p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 font-medium text-text-primary">Profile</h2>
            <UserForm
              key={user.id}
              initial={user}
              lockRole={user.id === me?.id}
              isLoading={updateMutation.isPending}
              onSubmit={async (values) => {
                try {
                  await updateMutation.mutateAsync({
                    name: values.name,
                    phone: values.phone,
                    ...(user.id === me?.id ? {} : { role: values.role }),
                  });
                  toast('User saved', 'success');
                } catch (err) {
                  toast(
                    err instanceof AppError ? err.message : 'Save failed',
                    'error',
                  );
                }
              }}
            />
          </section>

          <section>
            <h2 className="mb-4 font-medium text-text-primary">
              Recent orders ({user.ordersCount})
            </h2>
            {user.recentOrders.length === 0 ? (
              <p className="text-sm text-text-muted">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-(--radius-lg) border border-border">
                {user.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-brand-blush/20"
                    >
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-xs text-text-muted">
                          {ORDER_STATUS_LABELS[order.status]} ·{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatEGP(order.total)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete user?"
        description="This permanently removes the account. Orders remain with user unlinked."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              toast('User deleted', 'success');
              router.push('/admin/users');
            },
            onError: (err) => {
              toast(
                err instanceof AppError ? err.message : 'Could not delete user',
                'error',
              );
              setConfirmDelete(false);
            },
          });
        }}
      />
    </div>
  );
}
