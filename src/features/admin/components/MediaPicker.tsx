'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, SearchInput } from '@/shared/components/ui';
import { adminCatalogService } from '../services/admin-catalog.service';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', q],
    queryFn: () =>
      adminCatalogService.listMedia({ page: 1, pageSize: 48, q: q || undefined }),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close media picker"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface-raised p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">
            Media library
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-3">
          <SearchInput
            aria-label="Search media"
            placeholder="Search filename…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">
              No media yet. Upload on the Media page.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data?.items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="aspect-square w-full overflow-hidden rounded-(--radius) border border-border hover:border-brand-primary"
                    onClick={() => {
                      onSelect(m.url);
                      onClose();
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={m.alt ?? m.filename}
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
