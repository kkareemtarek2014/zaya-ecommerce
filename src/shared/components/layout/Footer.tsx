'use client';

import Link from 'next/link';
import { SITE } from '@/config/site.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { Mail, ArrowRight } from 'lucide-react';

const HELP_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/bride/custom', label: 'Bridal Requests' },
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'Track My Order' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-white pt-10 pb-8 sm:mt-20 sm:pt-16">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-brand-primary italic sm:text-4xl">
                {SITE.name}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:mt-4 sm:text-base">
                {SITE.description}
              </p>
            </div>

            <div className="mt-1 sm:mt-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary sm:mb-4 sm:text-sm">
                Subscribe to our newsletter
              </h3>
              <form
                className="relative flex w-full max-w-md items-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <Mail className="absolute left-3.5 h-4 w-4 text-text-muted sm:h-5 sm:w-5" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="w-full rounded-full border border-border bg-brand-blush/20 py-2.5 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-text-muted focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary sm:py-3 sm:pl-12 sm:pr-14"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 sm:right-2 sm:h-8 sm:w-8"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Links Section (Shop & Help in a 2-column grid on mobile/tablet) */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-7 lg:gap-12">
            {/* Categories */}
            <div className="lg:col-span-3">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary sm:mb-4 sm:text-sm">
                Shop
              </h3>
              <ul className="flex flex-col gap-2.5 sm:gap-3">
                {CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop/${cat.slug}`}
                      className="text-xs text-text-secondary transition-colors hover:text-brand-primary sm:text-sm"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div className="lg:col-span-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary sm:mb-4 sm:text-sm">
                Help
              </h3>
              <ul className="flex flex-col gap-2.5 sm:gap-3">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-text-secondary transition-colors hover:text-brand-primary sm:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-center text-xs text-text-muted sm:mt-14 sm:pt-8 sm:text-sm md:flex-row md:text-left">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-end">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
