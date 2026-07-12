'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { GOVERNORATES } from '@/shared/data/governorates.data';
import { Button, Input, Select } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { AppError } from '@/shared/contracts/errors';
import {
  selectCartDiscount,
  selectCartSubtotal,
  useCartStore,
} from '@/features/cart';
import { usePlaceOrder } from '@/features/order/hooks/useOrders';
import { checkoutSchema, type CheckoutFormValues } from '../schema/checkout.schema';
import { getShippingCost } from '../utils/shipping';

export function CheckoutForm() {
  const mounted = useHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const discount = useCartStore(selectCartDiscount);
  const couponCode = useCartStore((s) => s.couponCode);
  const note = useCartStore((s) => s.note);
  const placeOrder = usePlaceOrder();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'cod', governorate: '' },
  });

  const governorate = watch('governorate');
  // Preview only — free shipping keyed off pre-discount subtotal (server matches).
  const shipping = governorate ? getShippingCost(governorate, subtotal) : null;
  const total =
    shipping === null
      ? Math.max(0, subtotal - discount)
      : Math.max(0, subtotal - discount) + shipping;

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg text-text-secondary">
          Your bag is empty — add something you love first.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-block text-brand-primary underline underline-offset-4"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    setFormError(null);
    try {
      await placeOrder.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        address: {
          fullName: values.fullName,
          phone: values.phone,
          governorate: values.governorate,
          city: values.city,
          street: values.street,
          ...(values.notes ? { notes: values.notes } : {}),
        },
        paymentMethod: 'cod',
        ...(couponCode ? { promoCode: couponCode } : {}),
        ...(note ? { note } : {}),
      });
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not place order',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-10 lg:grid-cols-[1fr_380px]"
      noValidate
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Delivery Details
          </h2>
          {formError && (
            <p className="text-sm text-status-error">{formError}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              placeholder="Mariam Ahmed"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Mobile number"
              placeholder="01012345678"
              inputMode="numeric"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Select
              label="Governorate"
              error={errors.governorate?.message}
              {...register('governorate')}
            >
              <option value="" disabled>
                Select governorate…
              </option>
              {GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Input
              label="City / Area"
              placeholder="Maadi"
              autoComplete="address-level2"
              error={errors.city?.message}
              {...register('city')}
            />
          </div>
          <Input
            label="Street address"
            placeholder="Street, building, floor, apartment"
            autoComplete="street-address"
            error={errors.street?.message}
            {...register('street')}
          />
          <Input
            label="Order notes (optional)"
            placeholder="e.g. Call before delivery"
            error={errors.notes?.message}
            {...register('notes')}
          />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Payment</h2>
          <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-brand-primary bg-brand-blush/50 p-4">
            <input
              type="radio"
              value="cod"
              defaultChecked
              className="size-4 accent-brand-primary"
              {...register('paymentMethod')}
            />
            <Banknote className="size-5 text-brand-primary" />
            <div>
              <p className="text-sm font-medium">Cash on delivery</p>
              <p className="text-xs text-text-muted">
                Pay when your order arrives. Card payments coming soon.
              </p>
            </div>
          </label>
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface-raised p-6">
        <h2 className="font-display text-xl font-semibold">Your Order</h2>

        <ul className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <span className="line-clamp-1 text-text-secondary">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium">
                {formatEGP(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Subtotal</dt>
            <dd className="font-medium">{formatEGP(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-status-success">
              <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
              <dd className="font-medium">-{formatEGP(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-text-secondary">Shipping</dt>
            <dd className="font-medium">
              {shipping === null
                ? 'Select governorate'
                : shipping === 0
                  ? 'Free'
                  : formatEGP(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold text-brand-primary">
              {formatEGP(total)}
            </dd>
          </div>
        </dl>

        <Button
          type="submit"
          fullWidth
          size="lg"
          className="mt-5"
          isLoading={placeOrder.isPending}
        >
          {placeOrder.isPending ? 'Placing order…' : 'Place order'}
        </Button>
        <p className="mt-3 text-center text-xs text-text-muted">
          By placing your order you agree to our delivery terms.
        </p>
      </aside>
    </form>
  );
}
