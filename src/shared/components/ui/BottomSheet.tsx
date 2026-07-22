'use client';

import { useRef, useId, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';
import { useBackButtonClose } from '@/shared/hooks/useBackButtonClose';
import { useHydrated } from '@/shared/hooks/useHydrated';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Mobile bottom sheet: portal, focus trap, scroll lock, Esc, back-button close,
 * safe-area padding, overscroll-contain.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const mounted = useHydrated();

  const [shouldRender, setShouldRender] = useState(isOpen);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useFocusTrap(containerRef, isOpen);
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);
  useBackButtonClose(isOpen, onClose);

  if (!mounted || typeof document === 'undefined') return null;
  if (!shouldRender && !isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 h-dvh',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: true } : {})}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-surface-overlay/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[85dvh] w-full flex-col rounded-t-lg bg-surface-raised shadow-2xl transition-transform duration-300 ease-out',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
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
            className="flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-blush hover:text-brand-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-2 py-2">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
