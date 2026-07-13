import { z } from 'zod';

export const BUNDLE_TYPES = ['bxgy', 'set', 'fixed_price'] as const;
export const bundleTypeSchema = z.enum(BUNDLE_TYPES);
export type BundleType = z.infer<typeof bundleTypeSchema>;

export const adminBundleItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(20).default(1),
});

export const adminBundleDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: bundleTypeSchema,
  config: z.record(z.string(), z.unknown()),
  active: z.boolean(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  createdAt: z.string(),
  items: z.array(adminBundleItemSchema),
});

export type AdminBundleDTO = z.infer<typeof adminBundleDtoSchema>;

const bxgyConfigSchema = z.object({
  buyQty: z.number().int().min(1).max(20),
  getQty: z.number().int().min(1).max(20),
});

const fixedPriceConfigSchema = z.object({
  price: z.number().int().min(0),
});

export const adminBundleWriteSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    type: bundleTypeSchema,
    config: z.record(z.string(), z.unknown()),
    active: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    items: z.array(adminBundleItemSchema).min(1).max(30),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'bxgy') {
      const parsed = bxgyConfigSchema.safeParse(data.config);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'bxgy config needs buyQty and getQty',
          path: ['config'],
        });
      }
    } else {
      const parsed = fixedPriceConfigSchema.safeParse(data.config);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'set/fixed_price config needs integer price',
          path: ['config'],
        });
      }
    }
  });

export type AdminBundleWrite = z.infer<typeof adminBundleWriteSchema>;

const adminBundleUpdateBaseSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: bundleTypeSchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  items: z.array(adminBundleItemSchema).min(1).max(30).optional(),
});

export const adminBundleUpdateSchema = adminBundleUpdateBaseSchema.superRefine(
  (data, ctx) => {
    if (data.type == null && data.config == null) return;
    const type = data.type ?? 'bxgy';
    const config = data.config ?? {};
    if (type === 'bxgy') {
      const parsed = bxgyConfigSchema.safeParse(config);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'bxgy config needs buyQty and getQty',
          path: ['config'],
        });
      }
    } else {
      const parsed = fixedPriceConfigSchema.safeParse(config);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'set/fixed_price config needs integer price',
          path: ['config'],
        });
      }
    }
  },
);

export type AdminBundleUpdate = z.infer<typeof adminBundleUpdateSchema>;

export const adminBundleActiveSchema = z.object({
  active: z.boolean(),
});

export const bundleEvaluateInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export type BundleEvaluateInput = z.infer<typeof bundleEvaluateInputSchema>;

export const bundleEvaluateResultSchema = z.object({
  discount: z.number().int().min(0),
  bundleId: z.string().nullable(),
  bundleName: z.string().nullable(),
});

export type BundleEvaluateResult = z.infer<typeof bundleEvaluateResultSchema>;
