import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 bg-surface-secondary/30">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="bg-surface-primary p-8 md:p-10 rounded-2xl shadow-sm border border-border-light">
          {children}
        </div>
      </div>
    </div>
  );
}

