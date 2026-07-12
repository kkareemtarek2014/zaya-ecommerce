import type { Metadata } from 'next';
import { OrderDetails } from '@/features/order';

export const metadata: Metadata = {
  title: 'Order Details',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <OrderDetails orderId={id} />
    </div>
  );
}
