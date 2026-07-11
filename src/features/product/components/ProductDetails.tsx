'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, Star, Truck } from 'lucide-react';
import { useProduct } from '@/features/shop';
import { useCartStore } from '@/features/cart';
import { formatEGP, getSellPrice } from '@/shared/utils/price';
import { FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { Badge, Button, QuantityStepper } from '@/shared/components/ui';
import { ProductGallery } from './ProductGallery';
import { useRecentlyViewedStore } from '../store/recently-viewed.store';
import { ProductReviews } from './ProductReviews';
import { RelatedProducts } from './RelatedProducts';
import { NewArrivals } from './NewArrivals';
import { RecentlyViewed } from './RecentlyViewed';

export function ProductDetails({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);
  const addViewedProduct = useRecentlyViewedStore((s) => s.addProduct);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      addViewedProduct(product);
    }
  }, [product, addViewedProduct]);

  if (isLoading) {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-(--radius-lg) bg-brand-blush" />
        <div className="space-y-4 pt-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-brand-blush" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-brand-blush" />
          <div className="h-24 animate-pulse rounded bg-brand-blush" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg text-text-secondary">Product not found.</p>
        <Link
          href="/shop"
          className="mt-2 inline-block text-brand-primary underline underline-offset-4"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const price = getSellPrice(product.basePrice);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.tags?.includes('best seller') && (
              <Badge tone="accent">Best Seller</Badge>
            )}
            {product.compareAtPrice && <Badge tone="error">Sale</Badge>}
          </div>

          <h1 className="font-(family-name:--font-display) text-3xl font-semibold leading-tight lg:text-4xl">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-brand-accent text-brand-accent" />
              <span className="font-medium">{product.rating}</span>
            </div>
            <span className="text-text-muted">
              {product.reviewCount} reviews
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-brand-primary">
              {formatEGP(price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-text-muted line-through">
                {formatEGP(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="leading-relaxed text-text-secondary">
            {product.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <Button
              size="lg"
              onClick={handleAdd}
              disabled={!product.inStock}
              className="flex-1 sm:min-w-56 sm:flex-none"
            >
              {added ? (
                <>
                  <Check className="size-5" /> Added to bag
                </>
              ) : product.inStock ? (
                'Add to bag'
              ) : (
                'Sold out'
              )}
            </Button>
          </div>

          <ul className="mt-4 space-y-3 rounded-(--radius-lg) bg-brand-blush/60 p-5 text-sm text-text-secondary">
            <li className="flex items-center gap-3">
              <Truck className="size-4 shrink-0 text-brand-primary" />
              Free shipping on orders over {formatEGP(FREE_SHIPPING_THRESHOLD)}.
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 shrink-0 text-brand-primary" />
              Cash on delivery — pay only when it arrives.
            </li>
            <li className="flex items-center gap-3">
              <Check className="size-4 shrink-0 text-brand-primary" />
              Quality checked before it ships to you.
            </li>
          </ul>
        </div>
      </div>

      <ProductReviews />
      <RelatedProducts currentId={product.id} category={product.category} />
      <NewArrivals />
      <RecentlyViewed currentId={product.id} />
    </div>
  );
}
