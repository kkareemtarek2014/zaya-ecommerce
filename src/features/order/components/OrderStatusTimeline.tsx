import { Check, Package, Truck, Home, Search } from 'lucide-react';
import type { OrderStatus } from '@/shared/types/order.types';
import type { OrderTimelineEntry } from '@/shared/contracts/order.contract';
import { cn } from '@/shared/utils/cn';

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  sourced: 'Sourced',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Check },
  { id: 'confirmed', label: 'Confirmed', icon: Check },
  { id: 'sourced', label: 'Sourced', icon: Search },
  { id: 'shipped', label: 'Shipped', icon: Package },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
] as const;

const ACTOR_LABELS: Record<OrderTimelineEntry['actor'], string> = {
  admin: 'Admin',
  system: 'System',
  paymob: 'Paymob',
  bosta: 'Bosta',
};

export function OrderStatusTimeline({
  currentStatus,
  timeline,
}: {
  currentStatus: OrderStatus;
  timeline?: OrderTimelineEntry[];
}) {
  const currentIndex = STATUS_STEPS.findIndex((step) => step.id === currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const events = timeline ?? [];

  return (
    <div className="space-y-8">
      {isCancelled ? (
        <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-6 text-center text-status-error">
          <p className="font-medium">Order Cancelled</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border-light sm:left-auto sm:right-auto sm:top-10 sm:bottom-auto sm:h-0.5 sm:w-full sm:px-12" />
          <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:justify-between sm:gap-4">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-4 opacity-0 animate-fade-up sm:flex-col sm:gap-3 [animation-fill-mode:forwards]',
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      'flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-surface-primary transition-colors',
                      isCompleted
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-border text-text-muted',
                      isCurrent && 'ring-4 ring-brand-blush',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="sm:text-center">
                    <p
                      className={cn(
                        'font-medium',
                        isCompleted ? 'text-text-primary' : 'text-text-muted',
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
      )}

      {events.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-secondary">
            Status history
          </h3>
          <ol className="relative space-y-0 border-s border-border ms-3">
            {events.map((event) => (
              <li key={event.id} className="ms-6 pb-5 last:pb-0">
                <span className="absolute -start-1.5 mt-1.5 size-3 rounded-full border border-brand-primary bg-surface-raised" />
                <p className="text-sm font-medium text-text-primary">
                  {STATUS_LABELS[event.toStatus] ?? event.toStatus}
                  {event.fromStatus ? (
                    <span className="font-normal text-text-muted">
                      {' '}
                      ← {STATUS_LABELS[event.fromStatus] ?? event.fromStatus}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {ACTOR_LABELS[event.actor]}
                  {event.note ? ` · ${event.note}` : ''}
                </p>
                <time className="mt-0.5 block text-xs text-text-muted">
                  {new Date(event.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
