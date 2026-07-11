import { z } from 'zod';
import { GOVERNORATES } from '@/shared/data/governorates.data';

const governorateIds = GOVERNORATES.map((g) => g.id);

/** Egyptian mobile numbers: 010 / 011 / 012 / 015 + 8 digits. */
const egyptianPhone = /^01[0125][0-9]{8}$/;

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(egyptianPhone, 'Enter a valid Egyptian mobile (e.g. 01012345678)'),
  governorate: z
    .string()
    .refine((v) => governorateIds.includes(v), 'Please select a governorate'),
  city: z.string().trim().min(2, 'Please enter your city / area'),
  street: z
    .string()
    .trim()
    .min(5, 'Please enter street, building and apartment'),
  notes: z.string().trim().max(300, 'Notes are too long').optional(),
  paymentMethod: z.literal('cod'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
