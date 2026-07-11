'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  className,
}: QuantityStepperProps) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center rounded-(--radius) border border-border-strong',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-full w-10 items-center justify-center text-text-secondary transition-colors hover:text-brand-primary disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-full w-10 items-center justify-center text-text-secondary transition-colors hover:text-brand-primary disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
