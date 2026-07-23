import Image from 'next/image';
import { Metadata } from 'next';
import { SITE } from '@/config/site.config';

export const metadata: Metadata = {
  title: `About Sqoosh | Squishy Stress Toys in Egypt`,
  description:
    'Discover the story behind Sqoosh. We bring you quality-tested squishy stress toys across Egypt — small, medium & jumbo sizes for everyday calm. Cash on delivery.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: `About Sqoosh | Squishy Stress Toys in Egypt`,
    description:
      'Discover the story behind Sqoosh. We bring you quality-tested squishy stress toys across Egypt — small, medium & jumbo sizes for everyday calm. Cash on delivery.',
    url: `${SITE.url}/about`,
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          Our Story
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          About Sqoosh
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Sqoosh was born from a simple idea: everyone deserves a moment of calm. We sell one thing — squishy stress toys — and we make sure every squeeze feels just right.
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-8 items-center animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-blush/60 p-12 flex flex-col items-center justify-center text-center shadow-inner">
          <Image
            src="/images/brand/sqoosh-icon.svg"
            alt="Sqoosh Icon"
            width={160}
            height={160}
            className="size-40 object-contain drop-shadow-md"
            unoptimized
          />
          <span className="mt-4 font-display text-2xl font-bold tracking-widest text-brand-primary">Sqoosh</span>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl font-medium text-brand-primary">
              Squeeze-Tested Quality
            </h2>
            <p className="mt-3 text-text-secondary leading-relaxed">
              Based in Egypt, we source the best squishy stress toys — slow-rising, satisfyingly soft, and quality-checked before they reach your hands. Every batch goes through our squeeze-and-rebound test because a calm toy should actually calm you down.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-medium text-brand-primary">
              The Sqoosh Promise
            </h2>
            <p className="mt-3 text-text-secondary leading-relaxed">
              We keep it simple: three sizes (pocket, desk, jumbo), monthly themed drops, and no-hassle cash on delivery across all of Egypt. Our goal is to make your day a little softer — one squeeze at a time.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-3xl font-bold text-brand-primary">3</p>
              <p className="mt-1 text-sm font-medium text-text-muted">Size Categories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-primary">Egypt</p>
              <p className="mt-1 text-sm font-medium text-text-muted">Nationwide Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
