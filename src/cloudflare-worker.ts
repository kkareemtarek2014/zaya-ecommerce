/**
 * Custom Cloudflare Worker entry — OpenNext fetch + Cron Triggers (Phase 22).
 * @see https://opennext.js.org/cloudflare/howtos/custom-worker
 */
// Generated at build time by OpenNext — may be absent until `pnpm build`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as handler } from '../.open-next/worker.js';
import { dispatchScheduled } from './server/jobs';

export default {
  fetch: handler.fetch,

  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(
      dispatchScheduled({ cron: controller.cron }, env),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;
