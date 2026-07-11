export interface Category {
  slug: string;
  name: string;
  image: string;
  /** Unique SEO description used in <meta> for the category page. */
  seoDescription: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category slug
  /** Sourcing cost in EGP (what we pay, e.g. Temu price + inbound shipping). */
  basePrice: number;
  /** Optional "was" price for sale styling. Display price is derived from basePrice. */
  compareAtPrice?: number;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured?: boolean;
  tags?: string[];
}
