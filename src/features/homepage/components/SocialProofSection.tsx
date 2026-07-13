'use client';

import { useQuery } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features.config';
import { api } from '@/shared/lib/api-client';

type SocialProofDTO = {
  handle: string | null;
  postUrls: string[];
};

export function SocialProofSection() {
  const enabled = isFeatureEnabled('social_proof');
  const { data } = useQuery({
    queryKey: ['social-proof'],
    queryFn: () => api.get<SocialProofDTO>('/api/social-proof'),
    enabled,
  });

  if (!enabled || !data) return null;
  if (!data.handle && data.postUrls.length === 0) return null;

  const handle = data.handle?.replace(/^@/, '') ?? null;

  return (
    <section className="border-y border-border bg-surface-raised">
      <div className="mx-auto max-w-container px-4 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-accent">
              As worn
            </p>
            <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold lg:text-3xl">
              From the community
            </h2>
          </div>
          {handle ? (
            <a
              href={`https://instagram.com/${encodeURIComponent(handle)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              <Camera className="size-4" aria-hidden />@{handle}
            </a>
          ) : null}
        </div>
        {data.postUrls.length > 0 ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.postUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded-(--radius) border border-border bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  {url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-xl text-sm text-text-secondary">
            Follow us on Instagram for styling ideas and customer looks.
          </p>
        )}
      </div>
    </section>
  );
}
