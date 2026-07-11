import type { Metadata } from 'next';
import { OrderConfirmation } from '@/features/order';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <OrderConfirmation orderId={id} />
    </div>
  );
}
