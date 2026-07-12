'use client';

import { useHydrated } from '@/shared/hooks/useHydrated';
import { useCartStore } from '../store/cart.store';

export function OrderNote() {
  const mounted = useHydrated();
  const note = useCartStore((s) => s.note);
  const setNote = useCartStore((s) => s.setNote);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="order-note" className="text-sm font-medium text-text-primary">
        Add an order note
      </label>
      <textarea
        id="order-note"
        rows={3}
        placeholder="Delivery instructions, special requests..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full resize-none rounded-(--radius) border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary"
      />
    </div>
  );
}
