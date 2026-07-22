'use client';

import { cn } from '@/shared/utils/cn';

/** Operational tags shown as badges / sort signals — not theme filters. */
const META_TAGS = new Set(['best seller']);

interface TagChipsProps {
  /** Unique theme tags available in the loaded product set. */
  tags: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/** Multi-select theme tag chips (glow / food / animal / …). */
export function TagChips({
  tags,
  selected,
  onChange,
  className,
}: TagChipsProps) {
  if (tags.length === 0) return null;

  function toggle(tag: string) {
    const key = tag.toLowerCase();
    const isOn = selected.some((t) => t.toLowerCase() === key);
    if (isOn) {
      onChange(selected.filter((t) => t.toLowerCase() !== key));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <nav
      aria-label="Theme filters"
      className={cn(
        'no-scrollbar flex snap-x snap-proximity gap-2 overflow-x-auto pb-1',
        className,
      )}
    >
      {tags.map((tag) => {
        const isActive = selected.some(
          (t) => t.toLowerCase() === tag.toLowerCase(),
        );
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isActive}
            onClick={() => toggle(tag)}
            className={cn(
              'snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-sm capitalize transition-colors active:scale-[0.97]',
              isActive
                ? 'border-brand-primary bg-brand-primary text-text-inverse'
                : 'border-border bg-surface-raised text-text-secondary hover:border-brand-primary hover:text-brand-primary',
            )}
          >
            {tag}
          </button>
        );
      })}
    </nav>
  );
}

/** Distinct theme tags from a product list (excludes meta tags). */
export function collectThemeTags(
  products: { tags?: string[] }[] | undefined,
): string[] {
  if (!products?.length) return [];
  const seen = new Map<string, string>();
  for (const product of products) {
    for (const tag of product.tags ?? []) {
      const key = tag.toLowerCase();
      if (META_TAGS.has(key)) continue;
      if (!seen.has(key)) seen.set(key, tag);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

/** Parse `?tags=glow,food` into a string array. */
export function parseTagsParam(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
