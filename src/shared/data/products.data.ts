import type { ProductSeed } from '@/shared/types/product.types';

/**
 * Dummy catalog — seed source for D1 (`pnpm db:seed`).
 * `basePrice` is the sourcing cost in EGP (server-only after migration).
 */
export const PRODUCTS: ProductSeed[] = [
  {
    id: 'p-001',
    name: 'Aurora Gold-Plated Layered Necklace',
    category: 'jewelry',
    basePrice: 280,
    description:
      'A delicate three-layer necklace with a warm gold finish. Hypoallergenic, tarnish-resistant plating — dress it up or wear it every day.',
    images: ['/images/p-001.svg', '/images/p-001-b.svg'],
    rating: 4.8,
    reviewCount: 132,
    inStock: true,
    featured: true,
    tags: ['best seller'],
  },
  {
    id: 'p-002',
    name: 'Pearl Drop Earrings',
    category: 'jewelry',
    basePrice: 160,
    description:
      'Classic freshwater-style pearl drops on a gold-tone hook. Lightweight and elegant, perfect for evenings out.',
    images: ['/images/p-002.svg'],
    rating: 4.6,
    reviewCount: 88,
    inStock: true,
    featured: true,
  },
  {
    id: 'p-003',
    name: 'Céline Mini Shoulder Bag',
    category: 'bags',
    basePrice: 620,
    compareAtPrice: 1050,
    description:
      'A structured mini bag in soft vegan leather with a gold chain strap. Fits your phone, cards, and lipstick — the perfect going-out companion.',
    images: ['/images/p-003.svg', '/images/p-003-b.svg'],
    rating: 4.9,
    reviewCount: 214,
    inStock: true,
    featured: true,
    tags: ['best seller'],
  },
  {
    id: 'p-004',
    name: 'Quilted Crossbody Bag — Blush',
    category: 'bags',
    basePrice: 540,
    description:
      'Quilted vegan leather crossbody in a soft blush tone with an adjustable strap and magnetic closure.',
    images: ['/images/p-004.svg'],
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
  },
  {
    id: 'p-005',
    name: 'Silk Satin Scrunchie Set (6 pcs)',
    category: 'hair',
    basePrice: 95,
    description:
      'Six satin scrunchies in muted rose, cream, and champagne tones. Gentle on hair — no creases, no breakage.',
    images: ['/images/p-005.svg'],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    featured: true,
  },
  {
    id: 'p-006',
    name: 'Crystal Pearl Hair Clips (4 pcs)',
    category: 'hair',
    basePrice: 120,
    description:
      'Statement hair clips studded with pearls and crystals. Instantly elevates any hairstyle.',
    images: ['/images/p-006.svg'],
    rating: 4.4,
    reviewCount: 49,
    inStock: true,
  },
  {
    id: 'p-007',
    name: 'Parisian Chiffon Scarf — Rose Garden',
    category: 'scarves',
    basePrice: 190,
    description:
      'A featherlight chiffon scarf with a hand-drawn rose print. Wear it on your neck, hair, or handbag.',
    images: ['/images/p-007.svg'],
    rating: 4.6,
    reviewCount: 73,
    inStock: true,
    featured: true,
  },
  {
    id: 'p-008',
    name: 'Cashmere-Touch Winter Scarf — Cream',
    category: 'scarves',
    basePrice: 260,
    description:
      'An oversized soft-touch scarf in warm cream. Cozy, elegant, and generous enough to wear as a wrap.',
    images: ['/images/p-008.svg'],
    rating: 4.8,
    reviewCount: 91,
    inStock: true,
  },
  {
    id: 'p-009',
    name: 'Sofia Cat-Eye Sunglasses',
    category: 'sunglasses',
    basePrice: 310,
    compareAtPrice: 520,
    description:
      'Retro cat-eye frames with UV400 gradient lenses. Comes with a satin pouch and microfiber cloth.',
    images: ['/images/p-009.svg'],
    rating: 4.7,
    reviewCount: 118,
    inStock: true,
    featured: true,
  },
  {
    id: 'p-010',
    name: 'Oversized Square Sunglasses — Tortoise',
    category: 'sunglasses',
    basePrice: 275,
    description:
      'Bold oversized square frames in a classic tortoise pattern with UV400 protection.',
    images: ['/images/p-010.svg'],
    rating: 4.3,
    reviewCount: 41,
    inStock: true,
  },
  {
    id: 'p-011',
    name: 'Vienna Mesh Strap Watch — Rose Gold',
    category: 'watches',
    basePrice: 480,
    description:
      'A minimalist watch with a rose-gold mesh strap and mother-of-pearl dial. Water resistant, quartz movement.',
    images: ['/images/p-011.svg', '/images/p-011-b.svg'],
    rating: 4.9,
    reviewCount: 167,
    inStock: true,
    featured: true,
    tags: ['best seller'],
  },
  {
    id: 'p-012',
    name: 'Leather Strap Watch — Ivory Dial',
    category: 'watches',
    basePrice: 430,
    description:
      'A timeless watch with a slim ivory dial and genuine leather strap in soft taupe.',
    images: ['/images/p-012.svg'],
    rating: 4.5,
    reviewCount: 58,
    inStock: false,
  },
];
