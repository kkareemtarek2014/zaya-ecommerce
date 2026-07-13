import { z } from 'zod';

export const integrationIssueSchema = z.object({
  kind: z.enum(['payment_mismatch', 'missing_shipment', 'status_drift']),
  orderId: z.string(),
  detail: z.string(),
});

export const integrationsStatusSchema = z.object({
  onlinePayments: z.object({
    flag: z.boolean(),
    configured: z.boolean(),
    mock: z.boolean(),
  }),
  bostaShipping: z.object({
    flag: z.boolean(),
    configured: z.boolean(),
    mock: z.boolean(),
  }),
  issues: z.object({
    paymentMismatch: z.number().int(),
    missingShipment: z.number().int(),
    statusDrift: z.number().int(),
  }),
  samples: z.array(integrationIssueSchema),
});

export type IntegrationsStatusDTO = z.infer<typeof integrationsStatusSchema>;
