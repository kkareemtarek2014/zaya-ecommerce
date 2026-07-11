import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-container px-4 py-24 text-center lg:px-8">
      <p className="font-(family-name:--font-display) text-6xl font-semibold text-brand-primary">
        404
      </p>
      <p className="mt-3 text-lg text-text-secondary">
        This page seems to have wandered off.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-(--radius) bg-brand-primary px-6 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-secondary"
      >
        Back to home
      </Link>
    </div>
  );
}
