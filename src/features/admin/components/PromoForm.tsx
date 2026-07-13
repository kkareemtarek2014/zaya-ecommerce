'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '@/shared/components/ui';
import type { AdminPromoDTO } from '@/shared/contracts/admin-config.contract';

const baseSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .optional(),
    type: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().positive('Value must be positive'),
    minOrderValue: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal('')),
    maxRedemptions: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal('')),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'percentage' && (data.value <= 0 || data.value > 1)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Percentage must be 0–1 (e.g. 0.1 = 10%)',
        path: ['value'],
      });
    }
  });

type FormValues = z.infer<typeof baseSchema>;

export interface PromoFormSubmit {
  code?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number | null;
  maxRedemptions: number | null;
  active: boolean;
}

interface PromoFormProps {
  mode: 'create' | 'edit';
  initial?: AdminPromoDTO;
  onSubmit: (values: PromoFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function PromoForm({
  mode,
  initial,
  onSubmit,
  isLoading,
}: PromoFormProps) {
  const createSchema = baseSchema.extend({
    code: z.string().trim().min(2, 'Code must be at least 2 characters'),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      mode === 'create' ? createSchema : baseSchema,
    ) as Resolver<FormValues>,
    defaultValues: {
      code: initial?.code ?? '',
      type: initial?.type ?? 'percentage',
      value: initial?.value ?? 0.1,
      minOrderValue: initial?.minOrderValue ?? '',
      maxRedemptions: initial?.maxRedemptions ?? '',
      active: initial?.active ?? true,
    },
  });

  const promoType = watch('type');

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        const min =
          values.minOrderValue === '' || values.minOrderValue == null
            ? null
            : Number(values.minOrderValue);
        const max =
          values.maxRedemptions === '' || values.maxRedemptions == null
            ? null
            : Number(values.maxRedemptions);
        await onSubmit({
          ...(mode === 'create' && values.code
            ? { code: values.code.trim().toUpperCase() }
            : {}),
          type: values.type,
          value: values.value,
          minOrderValue: min,
          maxRedemptions: max,
          active: values.active,
        });
      })}
    >
      {mode === 'create' ? (
        <Input
          label="Code"
          placeholder="WELCOME10"
          error={errors.code?.message}
          {...register('code')}
        />
      ) : (
        <Input label="Code" value={initial?.code ?? ''} disabled readOnly />
      )}
      <Select label="Type" error={errors.type?.message} {...register('type')}>
        <option value="percentage">Percentage</option>
        <option value="fixed">Fixed amount (EGP)</option>
      </Select>
      <Input
        label={promoType === 'percentage' ? 'Value (0–1)' : 'Value (EGP)'}
        type="number"
        step={promoType === 'percentage' ? '0.01' : '1'}
        error={errors.value?.message}
        {...register('value')}
      />
      <Input
        label="Minimum order (EGP, optional)"
        type="number"
        step="1"
        placeholder="Leave empty for none"
        error={errors.minOrderValue?.message}
        {...register('minOrderValue')}
      />
      <Input
        label="Max redemptions (optional)"
        type="number"
        step="1"
        placeholder="Unlimited"
        error={errors.maxRedemptions?.message}
        {...register('maxRedemptions')}
      />
      {initial && initial.timesUsed != null ? (
        <p className="rounded-(--radius) border border-border bg-brand-blush/20 px-3 py-2 text-xs text-text-secondary">
          Used {initial.timesUsed}
          {initial.remaining != null ? ` · ${initial.remaining} remaining` : ''}
          {initial.discountTotal != null
            ? ` · ${initial.discountTotal} EGP discounted`
            : ''}
          {initial.revenueTotal != null
            ? ` · ${initial.revenueTotal} EGP revenue`
            : ''}
        </p>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-brand-primary"
          {...register('active')}
        />
        Active
      </label>
      <Button type="submit" isLoading={isLoading}>
        {mode === 'create' ? 'Create promo' : 'Save changes'}
      </Button>
    </form>
  );
}
