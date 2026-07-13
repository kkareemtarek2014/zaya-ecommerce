'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import {
  AdminBreadcrumbs,
  adminCatalogService,
} from '@/features/admin';
import type { AdminMediaDTO } from '@/shared/contracts/admin-catalog.contract';
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Pagination,
  SearchInput,
  useToast,
} from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

const PAGE_SIZE = 24;

export default function AdminMediaPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaDTO | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, q: q || undefined }),
    [page, q],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: () => adminCatalogService.listMedia(params),
  });

  const columns: DataTableColumn<AdminMediaDTO>[] = [
    {
      key: 'preview',
      header: '',
      className: 'w-16',
      cell: (row) => (
        <div className="size-12 overflow-hidden rounded-(--radius) bg-brand-blush/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.url}
            alt={row.alt ?? row.filename}
            className="size-full object-cover"
          />
        </div>
      ),
    },
    {
      key: 'filename',
      header: 'File',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.filename}</p>
          <p className="truncate text-xs text-text-muted">{row.url}</p>
        </div>
      ),
    },
    {
      key: 'meta',
      header: 'Meta',
      cell: (row) => (
        <span className="text-xs text-text-muted">
          {row.mime} · {Math.round(row.size / 1024)} KB
          {row.folder ? ` · ${row.folder}` : ''}
        </span>
      ),
    },
    {
      key: 'when',
      header: 'Uploaded',
      cell: (row) => (
        <time className="whitespace-nowrap text-xs text-text-muted">
          {new Date(row.createdAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20 text-right',
      cell: (row) => (
        <button
          type="button"
          aria-label={`Delete ${row.filename}`}
          className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Media' },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
            Media
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Shared image library for products. Delete is blocked while still
            attached.
          </p>
        </div>
        <Button
          type="button"
          isLoading={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              await adminCatalogService.uploadMedia(file);
              toast('Image uploaded', 'success');
              void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Upload failed',
                'error',
              );
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = '';
            }
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            aria-label="Search media"
            placeholder="Search filename…"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setQ(qDraft.trim());
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(1);
            setQ(qDraft.trim());
          }}
        >
          Search
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load media.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No media yet. Upload an image to get started."
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

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Delete media?"
        description="Blocked if this URL is still used on a product or category."
        confirmLabel="Delete"
        danger
        isLoading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await adminCatalogService.deleteMedia(deleteTarget.id);
            toast('Media deleted', 'success');
            setDeleteTarget(null);
            void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
          } catch (err) {
            toast(
              err instanceof AppError ? err.message : 'Could not delete',
              'error',
            );
            setDeleteTarget(null);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
