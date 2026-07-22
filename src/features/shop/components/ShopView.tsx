'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { CATEGORIES } from '@/shared/data/categories.data';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useProducts } from '../hooks/useProducts';
import {
  sortProducts,
  DEFAULT_SORT,
  parseSortKey,
  type SortKey,
} from '../utils/sortProducts';
import { CategoryPills } from './CategoryPills';
import { ProductGrid } from './ProductGrid';
import { ProductSort } from './ProductSort';
import {
  TagChips,
  collectThemeTags,
  parseTagsParam,
} from './TagChips';

/** Client render window — replace with API pagination when catalog > ~100 items. */
const PAGE_SIZE = 12;

export function ShopView({ category }: { category?: string }) {
  const { data, isLoading } = useProducts(category);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 150);
  const [searchOpen, setSearchOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortBy = parseSortKey(searchParams.get('sort'));
  const selectedTags = useMemo(
    () => parseTagsParam(searchParams.get('tags')),
    [searchParams],
  );

  // Reset load-more window when filters / category change (render-phase adjust).
  const filterKey = `${category ?? ''}|${debouncedSearch}|${selectedTags.join(',')}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const categoryName = category
    ? (CATEGORIES.find((c) => c.slug === category)?.name ?? 'Shop')
    : 'All Products';

  const themeTags = useMemo(() => collectThemeTags(data), [data]);

  function replaceParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setSortBy(next: SortKey) {
    replaceParams((params) => {
      if (next === DEFAULT_SORT) params.delete('sort');
      else params.set('sort', next);
    });
  }

  function setSelectedTags(next: string[]) {
    replaceParams((params) => {
      if (next.length === 0) params.delete('tags');
      else params.set('tags', next.join(','));
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setSearchOpen(false);
    replaceParams((params) => {
      params.delete('tags');
      params.delete('sort');
    });
  }

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const query = debouncedSearch.trim().toLowerCase();
    let list = data;
    if (query) {
      list = list.filter((product) =>
        product.name.toLowerCase().includes(query),
      );
    }
    if (selectedTags.length > 0) {
      list = list.filter((product) =>
        selectedTags.every((tag) =>
          product.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()),
        ),
      );
    }
    return sortProducts(list, sortBy);
  }, [data, debouncedSearch, selectedTags, sortBy]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    selectedTags.length > 0 ||
    sortBy !== DEFAULT_SORT;

  const emptyCategory =
    !isLoading &&
    (data?.length ?? 0) === 0 &&
    !hasActiveFilters;

  const noResults =
    !isLoading &&
    (data?.length ?? 0) > 0 &&
    filteredProducts.length === 0;

  const pagedProducts = filteredProducts.slice(0, visibleCount);
  const remaining = filteredProducts.length - pagedProducts.length;

  function renderSearchInput(autoFocus = false) {
    return (
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <input
          ref={autoFocus ? searchInputRef : undefined}
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-(--radius) border border-border bg-surface-raised py-2 pr-4 pl-9 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
          aria-label="Search products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-6 sm:py-10 lg:px-8">
      {/* M-10 compact header */}
      <p className="sr-only text-xs font-medium uppercase tracking-[0.25em] text-brand-accent sm:not-sr-only">
        Shop
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl lg:text-4xl">
        {categoryName}
      </h1>
      {!isLoading ? (
        <p className="mt-1 text-sm text-text-secondary">
          {filteredProducts.length}{' '}
          {filteredProducts.length === 1 ? 'squishy' : 'squishies'}
        </p>
      ) : null}

      {/* M-11 sticky toolbar — mobile */}
      <div className="sticky top-16 z-30 -mx-4 mt-4 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <CategoryPills active={category} />
          </div>
          <button
            type="button"
            aria-label={
              searchOpen || searchQuery ? 'Close search' : 'Open search'
            }
            aria-expanded={searchOpen || Boolean(searchQuery)}
            onClick={() => {
              if (searchOpen || searchQuery) {
                setSearchOpen(false);
                setSearchQuery('');
              } else {
                setSearchOpen(true);
              }
            }}
            className="flex size-11 shrink-0 items-center justify-center rounded-(--radius) border border-border bg-surface-raised text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary active:scale-[0.97]"
          >
            {searchOpen || searchQuery ? (
              <X className="size-4" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
          </button>
          <ProductSort
            value={sortBy}
            onChange={setSortBy}
            compact
          />
        </div>
        {searchOpen || searchQuery ? (
          <div className="mt-2 flex items-center gap-2">
            {renderSearchInput(true)}
          </div>
        ) : null}
        {themeTags.length > 0 ? (
          <TagChips
            tags={themeTags}
            selected={selectedTags}
            onChange={setSelectedTags}
            className="mt-2"
          />
        ) : null}
      </div>

      {/* Desktop / sm+ layout */}
      <div className="mt-6 hidden flex-col gap-4 sm:flex">
        <CategoryPills active={category} />
        {themeTags.length > 0 ? (
          <TagChips
            tags={themeTags}
            selected={selectedTags}
            onChange={setSelectedTags}
          />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {renderSearchInput(false)}
          <div className="flex items-center gap-2 sm:w-auto">
            <span className="hidden shrink-0 text-sm text-text-secondary sm:inline">
              Sort by
            </span>
            <ProductSort
              value={sortBy}
              onChange={setSortBy}
              className="w-full sm:w-52"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <ProductGrid
          products={pagedProducts}
          isLoading={isLoading}
          emptyVariant={
            emptyCategory ? 'empty-category' : noResults ? 'no-results' : undefined
          }
          hasActiveFilters={hasActiveFilters}
          filterSummary={[
            searchQuery.trim() ? `“${searchQuery.trim()}”` : null,
            selectedTags.length > 0
              ? selectedTags.map((t) => t).join(', ')
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          onClearFilters={clearFilters}
        />

        {/* M-17 load more — client window, not API pagination */}
        {!isLoading && remaining > 0 ? (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-(--radius) border border-border-strong bg-surface-raised text-sm font-medium text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary active:scale-[0.97]"
          >
            Load more ({remaining} left)
          </button>
        ) : null}
      </div>
    </div>
  );
}
