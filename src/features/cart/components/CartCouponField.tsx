'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui';
import { useCartStore } from '../store/cart.store';

interface CartCouponFieldProps {
  className?: string;
}

/** Apply / remove promo code — shared by cart drawer and checkout summary. */
export function CartCouponField({ className }: CartCouponFieldProps) {
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!couponInput.trim() || isApplying) return;
    setIsApplying(true);
    const res = await applyCoupon(couponInput);
    setIsApplying(false);
    if (res.success) {
      setCouponInput('');
      setCouponError(null);
    } else {
      setCouponError(res.error || 'Invalid code');
    }
  };

  if (couponCode) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between rounded-(--radius) bg-brand-blush px-3 py-2 text-sm">
          <span className="font-medium text-brand-primary">
            Code: {couponCode}
          </span>
          <button
            type="button"
            onClick={() => {
              removeCoupon();
              setCouponError(null);
            }}
            className="text-xs text-brand-secondary underline"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (!couponOpen) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setCouponOpen(true)}
          className="text-xs font-medium text-text-secondary underline underline-offset-2 hover:text-brand-primary"
        >
          Have a code?
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Coupon Code (e.g. WELCOME10)"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value);
              setCouponError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              void handleApply();
            }}
            className="flex-1 rounded-(--radius) border border-border px-3 py-1.5 text-base outline-none focus:border-brand-primary sm:text-sm"
            aria-label="Coupon code"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isApplying}
            onClick={() => void handleApply()}
          >
            Apply
          </Button>
        </div>
        {couponError ? (
          <p className="ml-1 text-xs text-status-error" role="alert">
            {couponError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setCouponOpen(false);
            setCouponError(null);
            setCouponInput('');
          }}
          className="self-start text-xs text-text-muted underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
