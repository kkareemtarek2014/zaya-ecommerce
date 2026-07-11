import type { ReactNode } from 'react';

/** Shared shell for legal/static pages (terms, privacy, cookies). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: {updated}</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-text-secondary [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-primary">
          {children}
        </div>
      </div>
    </div>
  );
}
