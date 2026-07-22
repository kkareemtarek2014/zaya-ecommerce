'use client';

import { useEffect, useRef } from 'react';

const OVERLAY_STATE = { overlay: true } as const;

/**
 * On open, pushes a history entry so Android back / iOS swipe-back closes the
 * overlay instead of leaving the page. On programmatic close (or unmount), pops
 * that entry when it is still on top (guarded against double-pop with popstate).
 */
export function useBackButtonClose(
  isOpen: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  const pushedRef = useRef(false);
  const closingViaBackRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (pushedRef.current && !closingViaBackRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
      closingViaBackRef.current = false;
      return;
    }

    window.history.pushState(OVERLAY_STATE, '');
    pushedRef.current = true;

    const onPopState = () => {
      if (!pushedRef.current) return;
      pushedRef.current = false;
      closingViaBackRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // SearchModal (and similar) unmount while still "open" — pop our entry.
      if (pushedRef.current && !closingViaBackRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [isOpen]);
}
