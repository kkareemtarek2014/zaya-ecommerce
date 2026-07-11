import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE } from '@/config/site.config';
import { getProductById } from '@/features/shop/services/products.service';
import { getSellPrice } from '@/shared/utils/price';
import { ProductDetails } from '@/features/product';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product not found' };

  const price = getSellPrice(product.basePrice);
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      type: 'website',
      title: `${product.name} · ${SITE.name}`,
      description: product.description,
      url: `${SITE.url}/product/${product.id}`,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
    other: {
      'product:price:amount': String(price),
      'product:price:currency': SITE.currency,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const price = getSellPrice(product.basePrice);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((src) => `${SITE.url}${src}`),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: SITE.currency,
      price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE.url}/product/${product.id}`,
    },
  };

  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails id={id} />
    </div>
  );
}
