import type { MetadataRoute } from 'next';

/**
 * Web app manifest for Add to Home Screen.
 * Theme/background hexes match --color-brand-primary / --color-surface.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sqoosh',
    short_name: 'Sqoosh',
    description: 'Squeeze the stress away — squishy stress toys delivered across Egypt.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfaf6',
    theme_color: '#129488',
    icons: [
      {
        src: '/images/brand/sqoosh-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
