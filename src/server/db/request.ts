import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from './client';

/**
 * Cloudflare bindings for the current request.
 *
 * Prefer the SYNCHRONOUS context — it is available per-request inside the
 * deployed/preview Worker. The `{ async: true }` form awaits the dev-init
 * promise from `initOpenNextCloudflareForDev()`, which only resolves during
 * `next build` (Node); at runtime in workerd it never resolves and the request
 * hangs. We therefore use sync first and fall back to async only for build-time
 * static generation, where the sync context isn't populated yet.
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  try {
    return getCloudflareContext().env;
  } catch {
    const { env } = await getCloudflareContext({ async: true });
    return env;
  }
}

export async function getRequestDb() {
  const env = await getCloudflareEnv();
  return getDb(env.DB);
}
