'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Clock, ImagePlus, X } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import {
  bridalRequestSchema,
  type BridalRequestFormValues,
} from '../schema/bridal-request.schema';
import { useSubmitBridalRequest } from '../hooks/useBridalRequest';

export function BridalRequestForm() {
  const submitMutation = useSubmitBridalRequest();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BridalRequestFormValues>({
    resolver: zodResolver(bridalRequestSchema),
  });

  if (submittedId) {
    return (
      <div className="animate-fade-up mx-auto max-w-lg rounded-(--radius-lg) border border-border bg-surface-raised p-8 text-center">
        <CircleCheck className="mx-auto size-12 text-status-success" />
        <h2 className="mt-4 font-(family-name:--font-display) text-2xl font-semibold">
          Request received!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Your request <span className="font-medium">{submittedId}</span> is
          with our bridal team. We’ll get back to you within{' '}
          <strong>2 days maximum</strong> with options and prices.
        </p>
        <Link href="/shop/bride" className="mt-6 inline-block">
          <Button variant="outline">Browse bridal accessories</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: BridalRequestFormValues) => {
    setFormError(null);
    try {
      const result = await submitMutation.mutateAsync(values);
      setSubmittedId(result.id);
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not send your request',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-lg space-y-4"
      noValidate
    >
      {formError && <p className="text-sm text-status-error">{formError}</p>}
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
      </div>

      <Input
        label="Wedding date (optional)"
        type="date"
        error={errors.weddingDate?.message}
        {...register('weddingDate')}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bridal-description"
          className="text-sm font-medium text-text-secondary"
        >
          Describe your dream accessory
        </label>
        <textarea
          id="bridal-description"
          rows={4}
          placeholder="e.g. A pearl hair vine to match my off-shoulder dress, silver tones…"
          aria-invalid={!!errors.description}
          className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-status-error">
            {errors.description.message}
          </p>
        )}
      </div>

      <Controller
        control={control}
        name="file"
        render={({ field: { value, onChange } }) => (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-secondary">
              Inspiration photo or video (optional)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => onChange(e.target.files?.[0])}
            />
            {value ? (
              <div className="flex items-center justify-between rounded-(--radius) border border-border bg-brand-blush/50 px-4 py-3 text-sm">
                <span className="line-clamp-1">{value.name}</span>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={() => {
                    onChange(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-text-muted transition-colors hover:text-status-error"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-(--radius) border border-dashed border-border-strong px-4 py-5 text-sm text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                <ImagePlus className="size-5" />
                Upload a photo or video
              </button>
            )}
            {errors.file && (
              <p className="text-xs text-status-error">
                {errors.file.message as string}
              </p>
            )}
          </div>
        )}
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={submitMutation.isPending}
      >
        Send my request
      </Button>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-text-muted">
        <Clock className="size-3.5" />
        Our bridal team replies within 2 days maximum.
      </p>
    </form>
  );
}
