/**
 * Optional Cloudflare Worker secrets (not always present in generated wrangler types).
 * Set via `wrangler secret put …` or `.dev.vars` for local.
 */
interface CloudflareEnv {
  /** P25 Temu scraper (use `mock` locally). */
  SCRAPER_API_KEY?: string;
  /** P24 optional FX provider key. */
  FX_API_KEY?: string;
  /** P13 Paymob — use `mock` for local intention/webhook smoke without live keys. */
  PAYMOB_SECRET_KEY?: string;
  PAYMOB_PUBLIC_KEY?: string;
  PAYMOB_HMAC_SECRET?: string;
  PAYMOB_INTEGRATION_ID_CARD?: string;
  PAYMOB_INTEGRATION_ID_WALLET?: string;
  /** P14 Bosta — use `mock` for local delivery/webhook smoke without live keys. */
  BOSTA_API_KEY?: string;
  BOSTA_WEBHOOK_SECRET?: string;
  BOSTA_BUSINESS_ID?: string;
}
