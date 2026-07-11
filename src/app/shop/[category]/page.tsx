import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE } from '@/config/site.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { ShopView } from '@/features/shop/components/ShopView';

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const match = CATEGORIES.find((c) => c.slug === category);
  if (!match) return { title: 'Shop' };

  const title = `${match.name} for Women in Egypt`;
  return {
    title,
    description: match.seoDescription,
    alternates: { canonical: `/shop/${match.slug}` },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description: match.seoDescription,
      url: `${SITE.url}/shop/${match.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const match = CATEGORIES.find((c) => c.slug === category);
  if (!match) notFound();

  return <ShopView category={category} />;
}
