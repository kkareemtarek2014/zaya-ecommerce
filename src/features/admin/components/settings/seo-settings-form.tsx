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
  seoDefaultTitle: z.string().trim().optional().or(z.literal('')),
  seoDefaultDescription: z.string().trim().optional().or(z.literal('')),
  footerText: z.string().trim().optional().or(z.literal('')),
});

type Values = z.infer<typeof schema>;

export type SeoSettingsFormSubmit = {
  seoDefaultTitle: string | null;
  seoDefaultDescription: string | null;
  footerText: string | null;
};

export interface SeoSettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: SeoSettingsFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

function emptyToNull(v: string | undefined) {
  const t = v?.trim() ?? '';
  return t ? t : null;
}

export function SeoSettingsForm({ initial, onSubmit, isLoading }: SeoSettingsFormProps) {
  const defaultValues = useMemo<Values>(
    () => ({
      seoDefaultTitle: initial.seoDefaultTitle ?? '',
      seoDefaultDescription: initial.seoDefaultDescription ?? '',
      footerText: initial.footerText ?? '',
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
        await onSubmit({
          seoDefaultTitle: emptyToNull(values.seoDefaultTitle),
          seoDefaultDescription: emptyToNull(values.seoDefaultDescription),
          footerText: emptyToNull(values.footerText),
        });
        reset(values);
      })}
    >
      <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
        <legend className="px-1 text-sm font-medium text-text-secondary">
          SEO defaults
        </legend>

        <Input
          label="Default SEO title"
          error={errors.seoDefaultTitle?.message}
          {...register('seoDefaultTitle')}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="seo-default-description"
            className="text-sm font-medium text-text-secondary"
          >
            Default SEO description
          </label>
          <textarea
            id="seo-default-description"
            rows={3}
            className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
            {...register('seoDefaultDescription')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="footer-text"
            className="text-sm font-medium text-text-secondary"
          >
            Footer text
          </label>
          <textarea
            id="footer-text"
            rows={2}
            className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
            {...register('footerText')}
          />
        </div>
      </fieldset>

      <StickySaveBar
        isDirty={isDirty}
        isSubmitting={Boolean(isLoading)}
        submitLabel="Save SEO"
        onDiscard={() => reset(defaultValues)}
      />
    </form>
  );
}

