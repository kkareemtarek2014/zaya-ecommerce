'use client';

import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import { Input } from '@/shared/components/ui';
import { StickySaveBar } from '../ui';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const schema = z.object({
  profitMargin: z.coerce.number().min(0.2, 'Minimum 20%').max(0.3, 'Maximum 30%'),
  lowStockThreshold: z.coerce.number().int().min(0),
  usdEgpRate: z.coerce.number().positive(),
  bulkShippingUsd: z.coerce.number().min(0),
  customsDutyRate: z.coerce.number().min(0).max(1),
  vatRate: z.coerce.number().min(0).max(1),
  handlingFeeEgp: z.coerce.number().int().min(0),
  targetMargin: z.coerce.number().min(0).max(2),
  priceRoundingEgp: z.coerce.number().int().min(1).max(100),
});

type Values = z.infer<typeof schema>;

export type PricingSettingsFormSubmit = {
  profitMargin: number;
  lowStockThreshold: number;
  usdEgpRate: number;
  bulkShippingUsd: number;
  customsDutyRate: number;
  vatRate: number;
  handlingFeeEgp: number;
  targetMargin: number;
  priceRoundingEgp: number;
};

export interface PricingSettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: PricingSettingsFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function PricingSettingsForm({
  initial,
  onSubmit,
  isLoading,
}: PricingSettingsFormProps) {
  const defaultValues = useMemo<Values>(
    () => ({
      profitMargin: initial.profitMargin,
      lowStockThreshold: initial.lowStockThreshold,
      usdEgpRate: initial.usdEgpRate,
      bulkShippingUsd: initial.bulkShippingUsd,
      customsDutyRate: initial.customsDutyRate,
      vatRate: initial.vatRate,
      handlingFeeEgp: initial.handlingFeeEgp,
      targetMargin: initial.targetMargin,
      priceRoundingEgp: initial.priceRoundingEgp,
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
    <form
      className="max-w-2xl space-y-6 pb-24"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
        reset(values);
      })}
    >
      <div className="space-y-4">
        <Input
          label="Profit margin"
          type="number"
          step="0.01"
          error={errors.profitMargin?.message}
          {...register('profitMargin')}
        />
        <Input
          label="Low-stock threshold"
          type="number"
          step="1"
          min={0}
          error={errors.lowStockThreshold?.message}
          {...register('lowStockThreshold')}
        />
      </div>

      <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
        <legend className="px-1 text-sm font-medium text-text-secondary">
          Landed-cost engine
        </legend>

        <Input
          label="USD to EGP rate"
          type="number"
          step="0.0001"
          min={0}
          error={errors.usdEgpRate?.message}
          {...register('usdEgpRate')}
        />

        <Input
          label="Bulk shipping (USD / item)"
          type="number"
          step="0.01"
          min={0}
          error={errors.bulkShippingUsd?.message}
          {...register('bulkShippingUsd')}
        />

        <Input
          label="Customs duty rate (e.g. 0.105)"
          type="number"
          step="0.001"
          min={0}
          max={1}
          error={errors.customsDutyRate?.message}
          {...register('customsDutyRate')}
        />

        <Input
          label="VAT rate (e.g. 0.14)"
          type="number"
          step="0.001"
          min={0}
          max={1}
          error={errors.vatRate?.message}
          {...register('vatRate')}
        />

        <Input
          label="Handling fee (EGP)"
          type="number"
          step="1"
          min={0}
          error={errors.handlingFeeEgp?.message}
          {...register('handlingFeeEgp')}
        />

        <Input
          label="Target margin on landed cost"
          type="number"
          step="0.01"
          min={0}
          max={2}
          error={errors.targetMargin?.message}
          {...register('targetMargin')}
        />

        <Input
          label="Price rounding (EGP)"
          type="number"
          step="1"
          min={1}
          max={100}
          error={errors.priceRoundingEgp?.message}
          {...register('priceRoundingEgp')}
        />
      </fieldset>
      <StickySaveBar
        isDirty={isDirty}
        isSubmitting={Boolean(isLoading)}
        submitLabel="Save pricing"
        onDiscard={() => reset(defaultValues)}
      />
    </form>
  );
}

