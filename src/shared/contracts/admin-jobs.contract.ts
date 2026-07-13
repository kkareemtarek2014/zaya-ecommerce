import { z } from 'zod';

export const adminJobNameSchema = z.enum([
  'cancel-unpaid',
  'pending-reminders',
  'cleanup-sessions',
  'daily-sales-summary',
  'fx-rate-refresh',
  'landed-cost-reprice',
  'temu-stock-sync',
  'integrations-reconcile',
]);

export type AdminJobName = z.infer<typeof adminJobNameSchema>;

export const adminJobRunSchema = z.object({
  job: adminJobNameSchema,
});

export type AdminJobRun = z.infer<typeof adminJobRunSchema>;

export const adminJobRunResultSchema = z.object({
  job: adminJobNameSchema,
  ok: z.boolean(),
  detail: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  error: z.string().optional(),
});

export type AdminJobRunResult = z.infer<typeof adminJobRunResultSchema>;
