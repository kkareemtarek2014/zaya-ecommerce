'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '@/shared/components/ui';
import type { AdminBundleDTO } from '@/shared/contracts/admin-bundles.contract';

const formSchema = z
  .object({
    name: z.string().trim().min(2),
    type: z.enum(['bxgy', 'set', 'fixed_price']),
    buyQty: z.coerce.number().int().min(1).max(20).optional(),
    getQty: z.coerce.number().int().min(1).max(20).optional(),
    price: z.coerce.number().int().min(0).optional(),
    productIds: z.string().trim().min(1, 'Add at least one product id'),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'bxgy') {
      if (!data.buyQty || !data.getQty) {
        ctx.addIssue({
          code: 'custom',
          message: 'Buy and get qty required',
          path: ['buyQty'],
        });
      }
    } else if (data.price == null || Number.isNaN(data.price)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Fixed price required',
        path: ['price'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface BundleFormSubmit {
  name: string;
  type: 'bxgy' | 'set' | 'fixed_price';
  config: Record<string, unknown>;
  items: Array<{ productId: string; qty: number }>;
  active: boolean;
}

interface BundleFormProps {
  initial?: AdminBundleDTO;
  onSubmit: (values: BundleFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function BundleForm({ initial, onSubmit, isLoading }: BundleFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'bxgy',
      buyQty:
        typeof initial?.config?.buyQty === 'number'
          ? initial.config.buyQty
          : 2,
      getQty:
        typeof initial?.config?.getQty === 'number'
          ? initial.config.getQty
          : 1,
      price:
        typeof initial?.config?.price === 'number' ? initial.config.price : 0,
      productIds: initial?.items.map((i) => i.productId).join(', ') ?? '',
      active: initial?.active ?? true,
    },
  });

  const type = watch('type');

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        const ids = values.productIds
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const config =
          values.type === 'bxgy'
            ? { buyQty: values.buyQty, getQty: values.getQty }
            : { price: values.price };
        await onSubmit({
          name: values.name,
          type: values.type,
          config,
          items: ids.map((productId) => ({ productId, qty: 1 })),
          active: values.active,
        });
      })}
    >
      <Input label="Name" error={errors.name?.message} {...register('name')} />
      <Select label="Type" error={errors.type?.message} {...register('type')}>
        <option value="bxgy">Buy X Get Y</option>
        <option value="set">Accessory set</option>
        <option value="fixed_price">Fixed price</option>
      </Select>
      {type === 'bxgy' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Buy qty"
            type="number"
            error={errors.buyQty?.message}
            {...register('buyQty')}
          />
          <Input
            label="Get qty (free)"
            type="number"
            error={errors.getQty?.message}
            {...register('getQty')}
          />
        </div>
      ) : (
        <Input
          label="Bundle price (EGP)"
          type="number"
          error={errors.price?.message}
          {...register('price')}
        />
      )}
      <Input
        label="Product IDs (comma-separated)"
        error={errors.productIds?.message}
        placeholder="p-xxxx, p-yyyy"
        {...register('productIds')}
      />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" {...register('active')} />
        Active
      </label>
      <Button type="submit" disabled={isLoading}>
        {initial ? 'Save bundle' : 'Create bundle'}
      </Button>
    </form>
  );
}
