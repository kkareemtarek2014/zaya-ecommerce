import 'server-only';
import { adminJobRunSchema } from '@/shared/contracts/admin-jobs.contract';
import type { AdminJobRunResult } from '@/shared/contracts/admin-jobs.contract';
import { getCloudflareEnv } from '@/server/db/request';
import { ValidationError } from '@/server/http/errors';
import { runCronJob } from '@/server/jobs';

export async function runAdminJob(raw: unknown): Promise<AdminJobRunResult> {
  const parsed = adminJobRunSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const env = await getCloudflareEnv();
  return runCronJob(env, parsed.data.job);
}
