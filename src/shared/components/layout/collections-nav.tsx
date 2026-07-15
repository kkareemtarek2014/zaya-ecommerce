import type { LucideIcon } from 'lucide-react';
import {
  Gem,
  Heart,
  Scissors,
  ShoppingBag,
  Sparkles,
  Sun,
  Watch,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  jewelry: Gem,
  bags: ShoppingBag,
  hair: Scissors,
  scarves: Sparkles,
  sunglasses: Sun,
  watches: Watch,
  bride: Heart,
};

export const CATEGORY_BADGES: Record<
  string,
  { label: string; tone: 'primary' | 'accent' }
> = {
  jewelry: { label: 'Hot', tone: 'primary' },
  bags: { label: 'Trending', tone: 'accent' },
};

export const FEATURED_COLLECTIONS = [
  {
    name: 'New Arrivals',
    href: '/shop?sort=newest',
    desc: 'Explore the latest weekly drops',
    badge: 'New',
  },
  {
    name: 'Best Sellers',
    href: '/shop?featured=true',
    desc: 'Most loved by our community',
    badge: 'Popular',
  },
  {
    name: 'Bridal Atelier',
    href: '/bride',
    desc: 'Custom accessories for your big day',
    badge: 'Bespoke',
  },
] as const;

export function categoryHref(slug: string): string {
  return slug === 'bride' ? '/bride' : `/shop/${slug}`;
}
