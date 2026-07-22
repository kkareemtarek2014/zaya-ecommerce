'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { BottomSheet, Select } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { SORT_OPTIONS, type SortKey } from '../utils/sortProducts';

interface ProductSortProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  className?: string;
  /** Compact trigger for the sticky mobile toolbar. */
  compact?: boolean;
}

/** Sort control: bottom sheet on mobile, native select from `sm+`. */
export function ProductSort({
  value,
  onChange,
  className,
  compact = false,
}: ProductSortProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Featured';

  return (
    <>
      {/* Mobile: button + bottom sheet */}
      <button
        type="button"
        aria-label={`Sort products: ${currentLabel}`}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-(--radius) border border-border bg-surface-raised text-sm font-medium text-text-primary transition-colors hover:border-brand-primary active:scale-[0.97] sm:hidden',
          compact
            ? 'size-11 shrink-0'
            : 'h-11 w-full px-3',
          className,
        )}
      >
        <ArrowUpDown className="size-4 shrink-0" aria-hidden />
        {!compact ? (
          <span className="truncate">Sort · {currentLabel}</span>
        ) : null}
      </button>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Sort by"
      >
        <ul role="listbox" aria-label="Sort options" className="flex flex-col">
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setSheetOpen(false);
                  }}
                  className={cn(
                    'flex min-h-12 w-full items-center rounded-(--radius) px-4 text-left text-base transition-colors active:scale-[0.97]',
                    selected
                      ? 'bg-brand-blush font-medium text-brand-primary'
                      : 'text-text-primary hover:bg-brand-blush/50',
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      {/* Desktop: native select */}
      <div className="hidden sm:block">
        <Select
          aria-label="Sort products"
          value={value}
          onChange={(e) => onChange(e.target.value as SortKey)}
          className={className}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
