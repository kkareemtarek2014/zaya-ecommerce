'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/cn';

/** Must match `WELCOME_OFFER.storageKey` in features/welcome-offer. */
const WELCOME_OFFER_STORAGE_KEY = 'sqoosh-welcome-offer-v1';

interface WhatsAppButtonProps {
  /** Digits-only WhatsApp id (no hardcoded default — hide FAB when unset). */
  phoneNumber: string;
  defaultMessage?: string;
  /** Lift FAB above StickyBuyBar on PDP mobile. */
  liftAboveStickyBuy?: boolean;
}

function welcomeOfferStillPending(): boolean {
  try {
    return window.localStorage.getItem(WELCOME_OFFER_STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

export function WhatsAppButton({
  phoneNumber,
  defaultMessage = 'Hello! I have a question about your accessories.',
  liftAboveStickyBuy = false,
}: WhatsAppButtonProps) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!phoneNumber) return;

    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    // At most one proactive interruption on mobile (M-21 + M-32): never auto-greet.
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    // On desktop: suppress while welcome popup still owns the session.
    if (isMobile || welcomeOfferStillPending()) {
      return () => {
        cancelAnimationFrame(frame);
      };
    }

    const greetingTimer = setTimeout(() => {
      setShowGreeting(true);
    }, 3500);

    const hideTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 12000);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(greetingTimer);
      clearTimeout(hideTimer);
    };
  }, [phoneNumber]);

  if (!phoneNumber || !isMounted) return null;

  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div
      className={cn(
        // Desktop only — hidden on phones so it never covers the storefront.
        'pointer-events-none fixed right-6 z-40 hidden flex-col items-end gap-3 font-sans select-none sm:flex',
        liftAboveStickyBuy
          ? 'bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))]'
          : 'bottom-[max(1.5rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div
        className={`max-w-70 origin-bottom-right pointer-events-auto transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showGreeting
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-90 opacity-0'
        }`}
      >
        <div className="relative flex flex-col gap-2 rounded-2xl border border-[#eddfd9] bg-[#fdfaf7] p-4 text-sm text-[#2b2226] shadow-[0_10px_30px_rgba(43,34,38,0.12)]">
          <button
            onClick={() => setShowGreeting(false)}
            className="absolute top-2.5 right-2.5 cursor-pointer text-[#a4949a] transition-colors hover:text-[#2b2226]"
            aria-label="Close message"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-[#c9a24b] uppercase">
              Personal Stylist
            </span>
          </div>

          <p className="pr-2 text-[13px] leading-relaxed font-normal text-[#6b5a60]">
            Need assistance with sizing or styling our accessories? We are here
            to help you.
          </p>

          <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 transform border-r border-b border-[#eddfd9] bg-[#fdfaf7]" />
        </div>
      </div>

      <div className="group relative pointer-events-auto">
        <span className="absolute -inset-1 rounded-full bg-linear-to-tr from-[#c9a24b]/20 to-[#b4536a]/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setShowGreeting(false)}
          className="relative flex transform items-center gap-2.5 rounded-full border border-[#c9a24b]/60 bg-[#fdfaf7]/90 py-3 pr-5 pl-4 text-[#2b2226] shadow-[0_4px_20px_rgba(43,34,38,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a24b] hover:shadow-[0_8px_30px_rgba(201,162,75,0.18)] active:translate-y-0"
          aria-label="Chat on WhatsApp"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-inner transition-transform duration-500 group-hover:rotate-360">
            <svg
              className="h-4.5 w-4.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.031 2a9.967 9.967 0 0 0-9.953 9.953c0 1.614.386 3.197 1.124 4.625L2 22l5.602-1.472a9.912 9.912 0 0 0 4.429 1.053 9.967 9.967 0 0 0 9.953-9.953A9.967 9.967 0 0 0 12.031 2zm4.704 12.98c-.198.554-1.12 1.018-1.536 1.056-.412.033-.822.183-2.65-.544-2.187-.872-3.585-3.08-3.695-3.228-.109-.147-.893-1.185-.893-2.262 0-1.077.563-1.607.762-1.822.2-.215.437-.268.583-.268.147 0 .293.002.421.008.135.006.316-.05.474.329.163.39.557 1.353.606 1.453.048.1.08.217.016.347-.064.13-.096.212-.192.324-.096.113-.203.25-.29.34-.099.102-.203.214-.087.412.117.198.522.86.11.77 1.25.79 1.109.199.247.1.32-.147.45-.098.156-.197.66-.75.877-.96.216-.21.432-.163.607-.065.176.1.986.486 1.234.61.248.124.412.186.474.293.062.108.062.623-.136 1.177z" />
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[12px] leading-none font-semibold tracking-wide text-[#2b2226]">
              Concierge
            </span>
            <span className="mt-0.5 text-[9px] leading-none font-normal text-[#6b5a60]">
              Online Assistance
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
