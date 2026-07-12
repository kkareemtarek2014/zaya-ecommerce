'use client';

import { Select } from '@/shared/components/ui';
import { SORT_OPTIONS, type SortKey } from '../utils/sortProducts';

interface ProductSortProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  className?: string;
}

/** Reusable sort dropdown for product listings. */
export function ProductSort({ value, onChange, className }: ProductSortProps) {
  return (
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
  );
}
