import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from '@/features/auth/schema/auth.schema';
import { USER_ROLES } from '@/shared/rbac';

export { forgotPasswordSchema, loginSchema, registerSchema };

export const userRoleSchema = z.enum(USER_ROLES);

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: userRoleSchema,
});

export type UserDTO = z.infer<typeof userDtoSchema>;
