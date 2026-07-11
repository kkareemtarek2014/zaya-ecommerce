import { z } from 'zod';

/** Egyptian mobile numbers: 010 / 011 / 012 / 015 + 8 digits. */
const egyptianPhone = /^01[0125][0-9]{8}$/;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED_TYPES = ['image/', 'video/'];

export const bridalRequestSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(egyptianPhone, 'Enter a valid Egyptian mobile (e.g. 01012345678)'),
  weddingDate: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Tell us a little more about what you’re dreaming of'),
  file: z
    .custom<File | undefined>()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      'File must be smaller than 25 MB',
    )
    .refine(
      (file) => !file || ACCEPTED_TYPES.some((t) => file.type.startsWith(t)),
      'Only photos or videos are accepted',
    )
    .optional(),
});

export type BridalRequestFormValues = z.infer<typeof bridalRequestSchema>;
