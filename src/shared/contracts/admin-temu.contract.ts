import { z } from 'zod';

export const temuImportWriteSchema = z.object({
  url: z
    .string()
    .trim()
    .url('Enter a valid Temu product URL')
    .refine(
      (u) => {
        try {
          const host = new URL(u).hostname.toLowerCase();
          return (
            host.includes('temu.com') ||
            host === 'localhost' ||
            host === '127.0.0.1'
          );
        } catch {
          return false;
        }
      },
      { message: 'URL must be a Temu product link' },
    ),
  categorySlug: z.string().trim().min(1).optional(),
  fulfilmentType: z.enum(['local_stock', 'dropship']).optional(),
});

export type TemuImportWrite = z.infer<typeof temuImportWriteSchema>;
