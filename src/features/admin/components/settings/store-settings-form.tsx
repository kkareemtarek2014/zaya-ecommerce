'use client';

import { useId, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import {
  AnnouncementItemsSchema,
  type AnnouncementItem,
} from '@/shared/contracts/storefront-branding.contract';
import { Button, Input } from '@/shared/components/ui';
import { StickySaveBar } from '../ui';
import { MediaPicker } from '../MediaPicker';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const schema = z.object({
  siteName: z.string().trim().min(1),
  siteTagline: z.string().trim().min(1),
  siteUrl: z.string().trim().url('Enter a valid URL'),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  faviconUrl: z.string().trim().optional().or(z.literal('')),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  whatsappNumber: z.string().trim().optional().or(z.literal('')),
  socialInstagram: z.string().trim().optional().or(z.literal('')),
  socialFacebook: z.string().trim().optional().or(z.literal('')),
  socialTiktok: z.string().trim().optional().or(z.literal('')),
  instagramHandle: z.string().trim().optional().or(z.literal('')),
  instagramPostUrls: z.string().optional(),
  maintenanceMode: z.boolean(),
});

type Values = z.infer<typeof schema>;

export type StoreSettingsFormSubmit = {
  siteName: string;
  siteTagline: string;
  siteUrl: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTiktok: string | null;
  instagramHandle: string | null;
  instagramPostUrls: string[];
  announcementItems: AnnouncementItem[];
  maintenanceMode: boolean;
};

export interface StoreSettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: StoreSettingsFormSubmit) => Promise<void>;
  isLoading?: boolean;
}

function emptyToNull(v: string | undefined): string | null {
  const t = v?.trim() ?? '';
  return t ? t : null;
}

function newAnnouncementId(): string {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function AnnouncementRowsEditor({
  items,
  onChange,
  error,
}: {
  items: AnnouncementItem[];
  onChange: (next: AnnouncementItem[]) => void;
  error?: string;
}) {
  const baseId = useId();
  const activeCount = items.filter((i) => i.active).length;

  const update = (index: number, patch: Partial<AnnouncementItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    if (!row) return;
    next.splice(target, 0, row);
    onChange(next.map((item, i) => ({ ...item, sortOrder: i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          Up to 5 active. Links: internal path (`/shop`) or https URL.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newAnnouncementId(),
                text: '',
                active: activeCount < 5,
                sortOrder: items.length,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-(--radius) border border-dashed border-border px-3 py-4 text-sm text-text-muted">
          No announcements yet. Active items rotate in the storefront header.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="space-y-2 rounded-lg border border-border bg-surface-raised p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-primary"
                  checked={item.active}
                  onChange={(e) => update(index, { active: e.target.checked })}
                />
                Active
              </label>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  className="rounded-(--radius) p-1.5 text-text-muted hover:bg-brand-blush hover:text-text-primary disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="rounded-(--radius) p-1.5 text-text-muted hover:bg-brand-blush hover:text-text-primary disabled:opacity-40"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove announcement"
                  className="rounded-(--radius) p-1.5 text-status-error hover:bg-brand-blush"
                  onClick={() =>
                    onChange(
                      items
                        .filter((_, i) => i !== index)
                        .map((row, i) => ({ ...row, sortOrder: i })),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${baseId}-text-${item.id}`}
                  className="text-sm font-medium text-text-secondary"
                >
                  Text (max 80)
                </label>
                <input
                  id={`${baseId}-text-${item.id}`}
                  value={item.text}
                  maxLength={80}
                  onChange={(e) => update(index, { text: e.target.value })}
                  className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${baseId}-href-${item.id}`}
                  className="text-sm font-medium text-text-secondary"
                >
                  Link (optional)
                </label>
                <input
                  id={`${baseId}-href-${item.id}`}
                  value={item.href ?? ''}
                  placeholder="/shop or https://..."
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    update(index, { href: v ? v : undefined });
                  }}
                  className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-status-error">{error}</p> : null}
    </div>
  );
}

export function StoreSettingsForm({
  initial,
  onSubmit,
  isLoading,
}: StoreSettingsFormProps) {
  const [mediaTarget, setMediaTarget] = useState<'logo' | 'favicon' | null>(
    null,
  );
  const [announcementItems, setAnnouncementItems] = useState<AnnouncementItem[]>(
    () =>
      [...(initial.announcementItems ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      ),
  );
  const [announcementError, setAnnouncementError] = useState<string | undefined>();
  const [announcementsDirty, setAnnouncementsDirty] = useState(false);

  const defaultValues = useMemo<Values>(
    () => ({
      siteName: initial.siteName,
      siteTagline: initial.siteTagline,
      siteUrl: initial.siteUrl,
      logoUrl: initial.logoUrl ?? '',
      faviconUrl: initial.faviconUrl ?? '',
      contactEmail: initial.contactEmail ?? '',
      contactPhone: initial.contactPhone ?? '',
      whatsappNumber: initial.whatsappNumber ?? '',
      socialInstagram: initial.socialInstagram ?? '',
      socialFacebook: initial.socialFacebook ?? '',
      socialTiktok: initial.socialTiktok ?? '',
      instagramHandle: initial.instagramHandle ?? '',
      instagramPostUrls: (initial.instagramPostUrls ?? []).join('\n'),
      maintenanceMode: initial.maintenanceMode,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues,
    shouldUnregister: false,
  });

  const logoUrl = watch('logoUrl');
  const faviconUrl = watch('faviconUrl');
  const dirty = isDirty || announcementsDirty;
  useUnsavedChangesGuard(dirty);

  return (
    <>
      <form
        className="max-w-2xl space-y-6 pb-24"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          const normalized = announcementItems.map((item, i) => ({
            ...item,
            text: item.text.trim(),
            href: item.href?.trim() || undefined,
            sortOrder: i,
          }));
          const parsed = AnnouncementItemsSchema.safeParse(normalized);
          if (!parsed.success) {
            setAnnouncementError(
              parsed.error.issues[0]?.message ?? 'Invalid announcements',
            );
            return;
          }
          setAnnouncementError(undefined);

          await onSubmit({
            siteName: values.siteName,
            siteTagline: values.siteTagline,
            siteUrl: values.siteUrl,
            logoUrl: emptyToNull(values.logoUrl),
            faviconUrl: emptyToNull(values.faviconUrl),
            contactEmail: emptyToNull(values.contactEmail),
            contactPhone: emptyToNull(values.contactPhone),
            whatsappNumber: emptyToNull(values.whatsappNumber),
            socialInstagram: emptyToNull(values.socialInstagram),
            socialFacebook: emptyToNull(values.socialFacebook),
            socialTiktok: emptyToNull(values.socialTiktok),
            instagramHandle: emptyToNull(values.instagramHandle),
            instagramPostUrls: (values.instagramPostUrls ?? '')
              .split('\n')
              .map((u) => u.trim())
              .filter(Boolean),
            announcementItems: parsed.data,
            maintenanceMode: values.maintenanceMode,
          });

          reset(values);
          setAnnouncementsDirty(false);
        })}
      >
        <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
          <legend className="px-1 text-sm font-medium text-text-secondary">
            Brand
          </legend>
          <Input
            label="Site name"
            error={errors.siteName?.message}
            {...register('siteName')}
          />
          <Input
            label="Site tagline"
            error={errors.siteTagline?.message}
            {...register('siteTagline')}
          />
          <Input
            label="Site URL"
            type="url"
            placeholder="https://example.com"
            error={errors.siteUrl?.message}
            {...register('siteUrl')}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <Input
                label="Logo URL"
                error={errors.logoUrl?.message}
                {...register('logoUrl')}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaTarget('logo')}
            >
              From library
            </Button>
          </div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-12 w-auto rounded-(--radius) border border-border object-contain"
            />
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <Input
                label="Favicon URL"
                error={errors.faviconUrl?.message}
                {...register('faviconUrl')}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaTarget('favicon')}
            >
              From library
            </Button>
          </div>
          {faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              className="size-8 rounded-(--radius) border border-border object-contain"
            />
          ) : null}
        </fieldset>

        <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
          <legend className="px-1 text-sm font-medium text-text-secondary">
            Contact & social
          </legend>
          <Input
            label="Contact email"
            type="email"
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />
          <Input
            label="Contact phone"
            error={errors.contactPhone?.message}
            {...register('contactPhone')}
          />
          <Input
            label="WhatsApp number"
            placeholder="2010xxxxxxxx"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
          <Input
            label="Instagram"
            placeholder="https://instagram.com/..."
            error={errors.socialInstagram?.message}
            {...register('socialInstagram')}
          />
          <Input
            label="Facebook"
            placeholder="https://facebook.com/..."
            error={errors.socialFacebook?.message}
            {...register('socialFacebook')}
          />
          <Input
            label="TikTok"
            placeholder="https://tiktok.com/..."
            error={errors.socialTiktok?.message}
            {...register('socialTiktok')}
          />
          <Input
            label="Instagram handle (social proof)"
            placeholder="@sqoosh.eg"
            error={errors.instagramHandle?.message}
            {...register('instagramHandle')}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="ig-posts"
              className="text-sm font-medium text-text-secondary"
            >
              Instagram post URLs (one per line)
            </label>
            <textarea
              id="ig-posts"
              rows={4}
              className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
              {...register('instagramPostUrls')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
          <legend className="px-1 text-sm font-medium text-text-secondary">
            Announcement bar
          </legend>
          <AnnouncementRowsEditor
            items={announcementItems}
            onChange={(next) => {
              setAnnouncementItems(next);
              setAnnouncementsDirty(true);
            }}
            error={announcementError}
          />
        </fieldset>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-brand-blush/20 px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-primary"
            {...register('maintenanceMode')}
          />
          <span>
            <span className="font-medium text-text-primary">
              Maintenance mode
            </span>
            <span className="mt-0.5 block text-text-secondary">
              Storefront shows a maintenance page. Admin dashboard stays
              reachable.
            </span>
          </span>
        </label>

        <StickySaveBar
          isDirty={dirty}
          isSubmitting={Boolean(isLoading)}
          submitLabel="Save store settings"
          onDiscard={() => {
            reset(defaultValues);
            setAnnouncementItems(
              [...(initial.announcementItems ?? [])].sort(
                (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
              ),
            );
            setAnnouncementsDirty(false);
            setAnnouncementError(undefined);
          }}
        />
      </form>

      <MediaPicker
        open={mediaTarget != null}
        onClose={() => setMediaTarget(null)}
        onSelect={(url) => {
          if (mediaTarget === 'logo') setValue('logoUrl', url, { shouldDirty: true });
          if (mediaTarget === 'favicon') {
            setValue('faviconUrl', url, { shouldDirty: true });
          }
        }}
      />
    </>
  );
}
