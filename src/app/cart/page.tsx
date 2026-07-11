import type { Metadata } from 'next';
import { CartView } from '@/features/cart';

export const metadata: Metadata = {
  title: 'Your Bag',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
        Your Bag
      </h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
