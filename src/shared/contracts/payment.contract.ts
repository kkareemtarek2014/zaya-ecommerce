import { z } from 'zod';

export const paymobIntentionInputSchema = z.object({
  orderId: z.string().min(1),
});

export type PaymobIntentionInput = z.infer<typeof paymobIntentionInputSchema>;

export const paymobIntentionResultSchema = z.object({
  orderId: z.string(),
  clientSecret: z.string(),
  publicKey: z.string(),
  checkoutUrl: z.string().min(1),
  paymentId: z.string(),
});

export type PaymobIntentionResult = z.infer<typeof paymobIntentionResultSchema>;

export const paymentStatusDtoSchema = z.object({
  orderId: z.string(),
  paymentMethod: z.enum(['cod', 'card', 'wallet']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  status: z.enum([
    'placed',
    'confirmed',
    'sourced',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
  amount: z.number().int(),
  providerStatus: z
    .enum(['pending', 'paid', 'failed', 'refunded'])
    .nullable()
    .optional(),
});

export type PaymentStatusDTO = z.infer<typeof paymentStatusDtoSchema>;
