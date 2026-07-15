'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { SITE, FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { cn } from '@/shared/utils/cn';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { CartDrawer } from '@/features/cart';
import { SearchButton } from '@/features/product-search';
import { useStorefrontConfig } from '@/features/admin';
import type { FeatureKey } from '@/config/features.config';
import { CollectionsMegaMenu } from './CollectionsMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';

const NAV_LINKS: {
  href: string;
  label: string;
  feature?: FeatureKey;
  bridal?: boolean;
}[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Collections', feature: 'shop' },
  { href: '/bride', label: 'Bride', bridal: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isShopEnabled = useFeature('shop');
  const isSearchEnabled = useFeature('product-search');
  const { data: storefrontConfig } = useStorefrontConfig();
  // Visible by default; hidden only when the admin toggle is explicitly off.
  const isBridalVisible = storefrontConfig?.bridalPage !== false;

  const navLinks = NAV_LINKS.filter((link) => {
    if (link.feature && !isShopEnabled) return false;
    if (link.bridal && !isBridalVisible) return false;
    return true;
  });

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-brand-primary text-text-inverse">
        <div className="mx-auto flex max-w-container items-center justify-center gap-6 overflow-x-auto px-4 py-2 text-xs font-medium tracking-wide whitespace-nowrap lg:px-8">
          <span>✨ New drop every week</span>
          <span aria-hidden className="opacity-40">
            ·
          </span>
          <span>
            Free shipping over {FREE_SHIPPING_THRESHOLD.toLocaleString()} EGP
          </span>
          <span aria-hidden className="hidden opacity-40 sm:inline">
            ·
          </span>
          <span className="hidden sm:inline">Cash on delivery, Egypt-wide</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/"
          className="font-display text-3xl font-bold tracking-wide text-brand-primary italic"
        >
          {SITE.name}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            if (link.label === 'Collections') {
              return (
                <CollectionsMegaMenu key={link.href} isActive={isActive} />
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative py-1 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-text-secondary hover:text-brand-primary',
                )}
              >
                <span>{link.label}</span>
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand-primary transition-transform duration-300 ease-out',
                    isActive
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isSearchEnabled && <SearchButton />}

          <Link
            href="/account"
            aria-label="User account"
            className="flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-brand-blush"
          >
            <User className="size-5" />
          </Link>

          <CartDrawer />

          <MobileNavDrawer
            links={navLinks}
            isOpen={menuOpen}
            onOpenChange={handleMenuOpenChange}
          />
        </div>
      </div>
    </header>
  );
}
