import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cache } from 'react';
import { getDb } from './client';

export const getCloudflareEnv = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return env;
});

export const getRequestDb = cache(async () => {
  const env = await getCloudflareEnv();
  return getDb(env.DB);
});
