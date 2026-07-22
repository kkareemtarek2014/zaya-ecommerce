'use client';

import { useEffect, useRef } from 'react';

let seq = 0;

/** True when `history.state` is still the marker *this* hook instance pushed. */
function isOwnState(marker: string): boolean {
  const state = window.history.state as { __overlay?: string } | null;
  return state?.__overlay === marker;
}

/**
 * On open, pushes a history entry so Android back / iOS swipe-back closes the
 * overlay instead of leaving the page. On programmatic close (or unmount), pops
 * that entry — but only when it's still on top of the history stack.
 *
 * Closing via a `<Link>` inside the overlay (e.g. cart drawer "Checkout") fires
 * our close handler AND a real client-side navigation from the *same* click.
 * That navigation calls `history.pushState` itself, replacing `history.state`
 * before our effect cleanup runs. If we called `history.back()` unconditionally
 * there, it would undo that navigation (button "does nothing"). Checking
 * `history.state` first means we only pop our own entry when nothing else has
 * touched history since — real navigations are left alone.
 */
export function useBackButtonClose(
  isOpen: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  const pushedRef = useRef(false);
  const closingViaBackRef = useRef(false);
  const markerRef = useRef<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (
        pushedRef.current &&
        !closingViaBackRef.current &&
        markerRef.current &&
        isOwnState(markerRef.current)
      ) {
        window.history.back();
      }
      pushedRef.current = false;
      closingViaBackRef.current = false;
      return;
    }

    const marker = `sqoosh-overlay-${(seq += 1)}`;
    markerRef.current = marker;
    window.history.pushState({ __overlay: marker }, '');
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
      // SearchModal (and similar) unmount while still "open" — pop our entry,
      // unless a navigation already moved history past it (same race as above).
      if (
        pushedRef.current &&
        !closingViaBackRef.current &&
        markerRef.current &&
        isOwnState(markerRef.current)
      ) {
        window.history.back();
      }
      pushedRef.current = false;
    };
  }, [isOpen]);
}
