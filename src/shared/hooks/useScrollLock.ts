'use client';

import { useEffect } from 'react';

/** Locks body scroll while active (modals, drawers). */
export function useScrollLock(isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isActive]);
}
