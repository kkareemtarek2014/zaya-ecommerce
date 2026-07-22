'use client';

import { Search } from 'lucide-react';
import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn';

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ label, className, id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            ref={ref}
            id={inputId}
            type="search"
            className={cn(
              'h-11 w-full rounded-(--radius) border border-border bg-surface-raised py-2 pr-4 pl-10 text-base text-text-primary sm:text-sm',
              'placeholder:text-text-muted',
              'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
              'transition-colors',
              className,
            )}
            {...props}
          />
        </div>
      </div>
    );
  },
);
