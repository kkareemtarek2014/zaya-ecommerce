'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import type { ShippingZoneDTO } from '@/shared/contracts/admin-config.contract';
import { AppError } from '@/shared/contracts/errors';
import { Button, Input, useToast } from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { StickySaveBar } from '../ui';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import {
  useAdminShippingZones,
  useUpdateZoneFee,
} from '../../hooks/useAdminConfig';

const schema = z.object({
  freeShippingThreshold: z.coerce.number().int().min(0),
  shippingEtaLocal: z.string().trim().min(1).max(80),
  shippingEtaDropship: z.string().trim().min(1).max(80),
});

type Values = z.infer<typeof schema>;

export type ShippingSettingsFormSubmit = {
  freeShippingThreshold: number;
  shippingEtaLocal: string;
  shippingEtaDropship: string;
};

export interface ShippingSettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: ShippingSettingsFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

function ZoneFeeRow({ zone }: { zone: ShippingZoneDTO }) {
  const { toast } = useToast();
  const updateFee = useUpdateZoneFee();
  const [fee, setFee] = useState(String(zone.fee));
  const dirty = Number(fee) !== zone.fee;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-(--radius) border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary">{zone.label}</p>
        <p className="text-xs text-text-muted">{zone.zone}</p>
      </div>
      <div className="w-32">
        <Input
          label="Fee (EGP)"
          type="number"
          min={0}
          step="1"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!dirty || updateFee.isPending}
        isLoading={updateFee.isPending}
        onClick={() => {
          const parsed = Number(fee);
          if (!Number.isInteger(parsed) || parsed < 0) {
            toast('Enter a valid fee', 'error');
            return;
          }
          updateFee.mutate(
            { zone: zone.zone, fee: parsed },
            {
              onSuccess: () => toast('Zone fee updated', 'success'),
              onError: (err) =>
                toast(
                  err instanceof AppError ? err.message : 'Update failed',
                  'error',
                ),
            },
          );
        }}
      >
        Save
      </Button>
      <p className="w-full text-xs text-text-muted sm:w-auto">
        Current: {formatEGP(zone.fee)}
      </p>
    </div>
  );
}

export function ShippingSettingsForm({
  initial,
  onSubmit,
  isLoading,
}: ShippingSettingsFormProps) {
  const { data: zones = [], isLoading: zonesLoading } = useAdminShippingZones();

  const defaultValues = useMemo<Values>(
    () => ({
      freeShippingThreshold: initial.freeShippingThreshold,
      shippingEtaLocal: initial.shippingEtaLocal,
      shippingEtaDropship: initial.shippingEtaDropship,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues,
    shouldUnregister: false,
  });

  useUnsavedChangesGuard(isDirty);

  return (
    <div className="max-w-2xl space-y-8 pb-24">
      <form
        className="space-y-6"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          reset(values);
        })}
      >
        <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
          <legend className="px-1 text-sm font-medium text-text-secondary">
            Free shipping & ETAs
          </legend>
          <Input
            label="Free shipping threshold (EGP)"
            type="number"
            step="1"
            min={0}
            error={errors.freeShippingThreshold?.message}
            {...register('freeShippingThreshold')}
          />
          <Input
            label="Shipping ETA - local stock"
            error={errors.shippingEtaLocal?.message}
            {...register('shippingEtaLocal')}
          />
          <Input
            label="Shipping ETA - dropship"
            error={errors.shippingEtaDropship?.message}
            {...register('shippingEtaDropship')}
          />
        </fieldset>

        <StickySaveBar
          isDirty={isDirty}
          isSubmitting={Boolean(isLoading)}
          submitLabel="Save shipping settings"
          onDiscard={() => reset(defaultValues)}
        />
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Zone fees
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Each zone saves independently. Manage governorate mapping on{' '}
              <Link
                href="/admin/locations"
                className="font-semibold text-brand-primary hover:underline"
              >
                Locations
              </Link>
              .
            </p>
          </div>
        </div>
        {zonesLoading ? (
          <p className="text-sm text-text-muted">Loading zones...</p>
        ) : (
          <div className="space-y-3">
            {zones.map((z) => (
              <ZoneFeeRow key={z.zone} zone={z} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
