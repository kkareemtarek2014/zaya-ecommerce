import { Check, Package, Truck, Home, Search } from 'lucide-react';
import type { OrderStatus } from '@/shared/types/order.types';
import { cn } from '@/shared/utils/cn';

const STATUS_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Check },
  { id: 'confirmed', label: 'Confirmed', icon: Check },
  { id: 'sourced', label: 'Sourced', icon: Search },
  { id: 'shipped', label: 'Shipped', icon: Package },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
] as const;

export function OrderStatusTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = STATUS_STEPS.findIndex((step) => step.id === currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-6 text-center text-status-error">
        <p className="font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border-light sm:left-auto sm:right-auto sm:top-10 sm:bottom-auto sm:h-0.5 sm:w-full sm:px-12" />
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between sm:gap-4 relative z-10">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-4 sm:flex-col sm:gap-3',
                // Add a simple fade-up stagger animation per rule #8
                'animate-fade-up opacity-0 [animation-fill-mode:forwards]',
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-surface-primary transition-colors',
                  isCompleted
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-border text-text-muted',
                  isCurrent && 'ring-4 ring-brand-blush'
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="sm:text-center">
                <p
                  className={cn(
                    'font-medium',
                    isCompleted ? 'text-text-primary' : 'text-text-muted'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
