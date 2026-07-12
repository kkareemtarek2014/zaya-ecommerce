'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import {
  AdminBreadcrumbs,
  useAdminBridalRequests,
  type BridalListParams,
} from '@/features/admin';
import type { AdminBridalRequestDTO } from '@/shared/contracts/admin-config.contract';
import {
  DataTable,
  type DataTableColumn,
  Pagination,
  Select,
} from '@/shared/components/ui';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<AdminBridalRequestDTO['status'], string> = {
  pending: 'Pending',
  answered: 'Answered',
};

export default function AdminBridalPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const params = useMemo(
    (): BridalListParams => ({
      page,
      pageSize: PAGE_SIZE,
      status:
        status === 'pending' || status === 'answered' ? status : undefined,
    }),
    [page, status],
  );

  const { data, isLoading, isError } = useAdminBridalRequests(params);

  const columns: DataTableColumn<AdminBridalRequestDTO>[] = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.fullName}</p>
          <p className="text-xs text-text-muted">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'wedding',
      header: 'Wedding date',
      cell: (row) => row.weddingDate ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => STATUS_LABELS[row.status],
    },
    {
      key: 'created',
      header: 'Submitted',
      cell: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) => (
        <Link
          href={`/admin/bridal/${row.id}`}
          className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
          aria-label={`View request ${row.id}`}
        >
          <Eye className="size-4" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs
        items={[{ label: 'Admin', href: '/admin' }, { label: 'Bridal' }]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Bridal requests
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Review custom bridal inquiries and mark them answered.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <Select
          aria-label="Filter by status"
          className="w-44"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="answered">Answered</option>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load requests.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No bridal requests match your filters."
          />
        )}
      </div>

      {data && data.total > 0 ? (
        <Pagination
          className="mt-4"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
