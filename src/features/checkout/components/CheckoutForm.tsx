'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, Smartphone, Sparkles } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import {
  MEMBER_DISCOUNT_PERCENT,
  computeMemberDiscount,
} from '@/config/site.config';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProfile, useAddresses } from '@/features/account';
import {
  getGovernorate,
  GOVERNORATES,
} from '@/shared/data/governorates.data';
import { useStorefrontConfig } from '@/features/admin';
import { Button, CheckoutBodySkeleton, Input, Select } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { AppError } from '@/shared/contracts/errors';
import {
  selectCartDiscount,
  selectCartSubtotal,
  useCartStore,
  type CartItem,
  CartCouponField,
} from '@/features/cart';
import { usePlaceOrder } from '@/features/order/hooks/useOrders';
import {
  checkoutSchema,
  type CheckoutFormValues,
} from '../schema/checkout.schema';
import {
  buildShippingPreviewConfig,
  getShippingCost,
} from '../utils/shipping';

function CheckoutOrderItems({ items }: { items: CartItem[] }) {
  return (
    <ul className="mt-4 space-y-4 border-b border-border pb-5">
      {items.map((item) => (
        <li key={item.productId} className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush">
            <Image
              src={item.image}
              alt={item.name}
              width={112}
              height={112}
              sizes="56px"
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="line-clamp-2 font-medium">{item.name}</p>
            <p className="text-text-muted">Qty {item.quantity}</p>
          </div>
          <span className="shrink-0 text-sm font-medium">
            {formatEGP(item.unitPrice * item.quantity)}
          </span>
        </li>
      ))}
    </ul>
  );
}

const FIELD_ORDER: (keyof CheckoutFormValues)[] = [
  'paymentMethod',
  'fullName',
  'phone',
  'governorate',
  'city',
  'street',
  'notes',
];

function scrollToFirstError(errors: FieldErrors<CheckoutFormValues>) {
  for (const key of FIELD_ORDER) {
    if (!errors[key]) continue;
    const el = document.querySelector<HTMLElement>(
      `[name="${key}"], #${key}`,
    );
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus?.();
      return;
    }
  }
}

export function CheckoutForm() {
  const mounted = useHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const discount = useCartStore(selectCartDiscount);
  const couponCode = useCartStore((s) => s.couponCode);
  const note = useCartStore((s) => s.note);
  const placeOrder = usePlaceOrder();
  const { data: storefrontConfig } = useStorefrontConfig();
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const { data: profile } = useProfile({ enabled: isAuthenticated });
  const { data: addresses } = useAddresses({ enabled: isAuthenticated });

  const onlinePayments = Boolean(storefrontConfig?.onlinePayments);

  const previewConfig = useMemo(
    () => buildShippingPreviewConfig(storefrontConfig),
    [storefrontConfig],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'cod', governorate: '' },
  });

  // Prefill delivery details from the signed-in customer's account (once).
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !isAuthenticated || !profile) return;
    const addr = addresses?.[0];
    reset({
      paymentMethod: getValues('paymentMethod') || 'cod',
      fullName: profile.fullName ?? '',
      phone: profile.phone ?? '',
      governorate: addr?.governorate ?? '',
      city: addr?.city ?? '',
      street: addr?.street ?? '',
      notes: '',
    });
    prefilledRef.current = true;
  }, [isAuthenticated, profile, addresses, reset, getValues]);

  const governorate = watch('governorate');
  const paymentMethod = watch('paymentMethod');
  const zone = governorate ? getGovernorate(governorate)?.zone : undefined;
  const shipping = governorate
    ? getShippingCost(zone, subtotal, previewConfig)
    : null;
  // Signed-in customers get an extra loyalty discount (enforced server-side too).
  const memberDiscount = isAuthenticated ? computeMemberDiscount(subtotal) : 0;
  const afterDiscounts = Math.max(0, subtotal - discount - memberDiscount);
  const total = shipping === null ? afterDiscounts : afterDiscounts + shipping;

  if (!mounted) {
    return <CheckoutBodySkeleton />;
  }

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
    const method =
      onlinePayments &&
      (values.paymentMethod === 'card' || values.paymentMethod === 'wallet')
        ? values.paymentMethod
        : 'cod';
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
        paymentMethod: method,
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

  const submitLabel =
    paymentMethod === 'card' || paymentMethod === 'wallet'
      ? `Place order & pay · ${formatEGP(total)}`
      : `Place order · ${formatEGP(total)}`;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, scrollToFirstError)}
      className="grid gap-10 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0"
      noValidate
    >
      <div className="space-y-8">
        {/* Guests: nudge to sign in for the extra member discount */}
        {sessionChecked && !isAuthenticated ? (
          <div className="flex flex-col gap-3 rounded-lg border border-brand-primary/30 bg-brand-blush/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-primary" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Log in and save an extra {MEMBER_DISCOUNT_PERCENT}%
                  {computeMemberDiscount(subtotal) > 0
                    ? ` (−${formatEGP(computeMemberDiscount(subtotal))})`
                    : ''}
                </p>
                <p className="text-xs text-text-secondary">
                  Members get {MEMBER_DISCOUNT_PERCENT}% off this order — or keep
                  going as a guest.
                </p>
              </div>
            </div>
            <Link
              href="/auth/login?redirect=/checkout"
              className="inline-flex shrink-0 items-center justify-center rounded-(--radius) bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-secondary"
            >
              Log in &amp; save
            </Link>
          </div>
        ) : null}

        {/* Payment first so COD explainer is visible on 375px without scrolling */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Payment</h2>
          <div className="space-y-3">
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${
                paymentMethod === 'cod'
                  ? 'border-brand-primary bg-brand-blush/50'
                  : 'border-border'
              }`}
            >
              <input
                type="radio"
                value="cod"
                className="size-4 accent-brand-primary"
                {...register('paymentMethod')}
              />
              <Banknote className="size-5 text-brand-primary" />
              <div>
                <p className="text-sm font-medium">Cash on delivery</p>
                <p className="text-xs text-text-muted">
                  Pay when your order arrives — no card needed.
                </p>
              </div>
            </label>

            {onlinePayments ? (
              <>
                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${
                    paymentMethod === 'card'
                      ? 'border-brand-primary bg-brand-blush/50'
                      : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    value="card"
                    className="size-4 accent-brand-primary"
                    {...register('paymentMethod')}
                  />
                  <CreditCard className="size-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-medium">Card</p>
                    <p className="text-xs text-text-muted">
                      Pay securely with Visa / Mastercard (Paymob).
                    </p>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${
                    paymentMethod === 'wallet'
                      ? 'border-brand-primary bg-brand-blush/50'
                      : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    value="wallet"
                    className="size-4 accent-brand-primary"
                    {...register('paymentMethod')}
                  />
                  <Smartphone className="size-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-medium">Mobile wallet</p>
                    <p className="text-xs text-text-muted">
                      Vodafone Cash, Orange Cash, and more via Paymob.
                    </p>
                  </div>
                </label>
              </>
            ) : null}
          </div>
          {errors.paymentMethod ? (
            <p className="text-xs text-status-error">
              {errors.paymentMethod.message}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Delivery Details
          </h2>
          {formError ? (
            <p className="text-sm text-status-error" role="alert">
              {formError}
            </p>
          ) : null}
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
              type="tel"
              placeholder="01012345678"
              inputMode="numeric"
              autoComplete="tel"
              hint="Egyptian mobile starting 01…"
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
      </div>

      {/* Order summary — items + totals (submit button desktop-only; mobile uses sticky bar) */}
      <aside className="h-fit rounded-lg border border-border bg-surface-raised p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Order Summary</h2>
        <CheckoutOrderItems items={items} />
        <CartCouponField className="mt-4" />
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Subtotal</dt>
            <dd className="font-medium">{formatEGP(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-status-success">
              <dt>
                Discount
                {couponCode ? ` (${couponCode})` : ''}
              </dt>
              <dd>-{formatEGP(discount)}</dd>
            </div>
          ) : null}
          {memberDiscount > 0 ? (
            <div className="flex justify-between text-status-success">
              <dt>Member discount ({MEMBER_DISCOUNT_PERCENT}%)</dt>
              <dd>-{formatEGP(memberDiscount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-text-secondary">Shipping</dt>
            <dd>
              {shipping === null ? (
                <span className="text-text-muted">Select governorate</span>
              ) : shipping === 0 ? (
                'Free'
              ) : (
                formatEGP(shipping)
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-brand-primary">{formatEGP(total)}</dd>
          </div>
        </dl>
        <Button
          type="submit"
          fullWidth
          size="lg"
          className="mt-5 hidden lg:inline-flex"
          isLoading={placeOrder.isPending}
        >
          {submitLabel}
        </Button>
      </aside>

      {/* Mobile sticky submit + compact total */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-raised/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total</span>
          <span className="font-semibold text-brand-primary">
            {formatEGP(total)}
          </span>
        </div>
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={placeOrder.isPending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
