import 'server-only';

export type NormalizedTemuProduct = {
  title: string;
  descriptionHtml: string;
  imageUrls: string[];
  basePriceUsd: number;
  sourceProductId: string;
  sourceUrl: string;
  inStock: boolean;
  variants: Record<string, unknown>;
};

export type TemuScraperProvider = {
  name: string;
  fetchProduct: (url: string) => Promise<NormalizedTemuProduct>;
};

function extractProductId(url: string): string {
  try {
    const u = new URL(url);
    const fromQuery =
      u.searchParams.get('goods_id') ||
      u.searchParams.get('goodsId') ||
      u.searchParams.get('id');
    if (fromQuery) return fromQuery;
    const pathMatch = u.pathname.match(/(\d{6,})/);
    if (pathMatch?.[1]) return pathMatch[1];
  } catch {
    /* ignore */
  }
  return `mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

/** Local/dev fixture — enabled when SCRAPER_API_KEY=mock. */
export const mockTemuProvider: TemuScraperProvider = {
  name: 'mock',
  async fetchProduct(url: string): Promise<NormalizedTemuProduct> {
    const id = extractProductId(url);
    const oos = /oos|out[-_]?of[-_]?stock/i.test(url);
    return {
      title: `Temu import ${id}`,
      descriptionHtml: `<p>Imported draft from Temu (mock provider).</p><p>Source: ${url}</p>`,
      imageUrls: ['/images/hero.svg'],
      basePriceUsd: 4.5,
      sourceProductId: id,
      sourceUrl: url,
      inStock: !oos,
      variants: { color: ['Gold', 'Silver'], size: ['One size'] },
    };
  },
};

/**
 * Piloterr / SearchAPI-style adapter. Expects JSON with common product fields.
 * Swap implementation when the chosen vendor is locked.
 */
export function createHttpScraperProvider(
  apiKey: string,
): TemuScraperProvider {
  return {
    name: 'http-scraper',
    async fetchProduct(url: string): Promise<NormalizedTemuProduct> {
      // Generic webhook-style endpoint; replace host when vendor is chosen.
      const endpoint = new URL('https://api.piloterr.com/v2/temu/product');
      endpoint.searchParams.set('url', url);
      const res = await fetch(endpoint, {
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Scraper HTTP ${res.status}`);
      }
      const body = (await res.json()) as Record<string, unknown>;
      const title =
        (typeof body.title === 'string' && body.title) ||
        (typeof body.name === 'string' && body.name) ||
        null;
      const priceRaw =
        typeof body.price === 'number'
          ? body.price
          : typeof body.base_price_usd === 'number'
            ? body.base_price_usd
            : Number(body.price);
      const images = Array.isArray(body.images)
        ? body.images.filter((x): x is string => typeof x === 'string')
        : Array.isArray(body.image_urls)
          ? body.image_urls.filter((x): x is string => typeof x === 'string')
          : [];
      const description =
        (typeof body.description_html === 'string' && body.description_html) ||
        (typeof body.description === 'string' && body.description) ||
        `<p>${title ?? 'Temu product'}</p>`;
      const sourceProductId =
        (typeof body.product_id === 'string' && body.product_id) ||
        (typeof body.id === 'string' && body.id) ||
        extractProductId(url);
      const inStock =
        typeof body.in_stock === 'boolean'
          ? body.in_stock
          : body.availability !== 'out_of_stock';

      if (!title || !Number.isFinite(priceRaw) || priceRaw <= 0) {
        throw new Error('Scraper response missing title or price');
      }

      return {
        title,
        descriptionHtml: description.startsWith('<')
          ? description
          : `<p>${description}</p>`,
        imageUrls: images.slice(0, 8),
        basePriceUsd: priceRaw,
        sourceProductId,
        sourceUrl: url,
        inStock,
        variants:
          body.variants && typeof body.variants === 'object'
            ? (body.variants as Record<string, unknown>)
            : {},
      };
    },
  };
}

export function resolveTemuProvider(
  env: CloudflareEnv,
): TemuScraperProvider {
  const key =
    'SCRAPER_API_KEY' in env &&
    typeof (env as { SCRAPER_API_KEY?: string }).SCRAPER_API_KEY === 'string'
      ? (env as { SCRAPER_API_KEY?: string }).SCRAPER_API_KEY!.trim()
      : '';

  if (!key || key === 'mock') {
    return mockTemuProvider;
  }
  return createHttpScraperProvider(key);
}

export async function fetchSourceStockStatus(
  env: CloudflareEnv,
  url: string,
): Promise<{ inStock: boolean; provider: string }> {
  const provider = resolveTemuProvider(env);
  const product = await provider.fetchProduct(url);
  return { inStock: product.inStock, provider: provider.name };
}
