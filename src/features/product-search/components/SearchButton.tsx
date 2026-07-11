'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

/** Header search icon that opens the search popup. */
export function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Search products"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-brand-blush"
      >
        <Search className="size-5" />
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
