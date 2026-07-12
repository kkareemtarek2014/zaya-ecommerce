import { z } from 'zod';

export const bridalRequestResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'answered']),
  createdAt: z.string(),
});

export type BridalRequestResponse = z.infer<typeof bridalRequestResponseSchema>;

/** Text fields from multipart (file validated separately). */
export const bridalRequestFieldsSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'Enter a valid Egyptian mobile'),
  weddingDate: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Tell us a little more about what you’re dreaming of'),
});

export type BridalRequestFields = z.infer<typeof bridalRequestFieldsSchema>;
