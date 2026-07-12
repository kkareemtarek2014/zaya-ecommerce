#!/usr/bin/env node
/**
 * OpenNext sometimes emits duplicated exports in .open-next/cloudflare/next-env.mjs
 * which breaks `wrangler deploy`. Normalize before deploy/preview.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.open-next',
  'cloudflare',
  'next-env.mjs',
);

const contents = `export const production = {};
export const development = {};
export const test = {};
`;

if (fs.existsSync(file)) {
  fs.writeFileSync(file, contents);
  console.log('Normalized .open-next/cloudflare/next-env.mjs');
} else {
  console.warn('skip: next-env.mjs not found (build may have failed earlier)');
}
