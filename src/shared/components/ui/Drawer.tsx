'use client';

import { useRef, useId, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';
import { useHydrated } from '@/shared/hooks/useHydrated';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Slide-in edge. Defaults to `right` (cart). Use `left` for mobile nav. */
  side?: 'left' | 'right';
}

/**
 * Slide-in panel with overlay. Portal to body, focus trap, scroll lock, Esc.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
}: DrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const mounted = useHydrated();

  const [shouldRender, setShouldRender] = useState(isOpen);

  // Render-phase adjustment (React's "derive state from props" pattern) —
  // avoids a synchronous setState inside an effect.
  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useFocusTrap(containerRef, isOpen);
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!mounted || typeof document === 'undefined') return null;
  if (!shouldRender && !isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: true } : {})}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-surface-overlay/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute top-0 flex h-full w-full flex-col bg-surface-raised shadow-2xl transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0 max-w-sm' : 'right-0 max-w-md',
          isOpen
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id={titleId}
            className="font-display text-xl font-semibold"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-blush hover:text-brand-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
