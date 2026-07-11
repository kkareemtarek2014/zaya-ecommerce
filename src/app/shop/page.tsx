import type { Metadata } from 'next';
import { SITE } from '@/config/site.config';
import { ShopView } from '@/features/shop/components/ShopView';

export const metadata: Metadata = {
  title: 'Shop Women’s Accessories',
  description: `Browse all accessories at ${SITE.name} — jewelry, bags, hair, scarves, sunglasses and watches. Cash on delivery across Egypt.`,
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return <ShopView />;
}
