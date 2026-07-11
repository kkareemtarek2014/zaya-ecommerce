import type { Metadata } from 'next';
import { CheckoutForm } from '@/features/checkout';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
        Checkout
      </h1>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
