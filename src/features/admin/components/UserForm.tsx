'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '@/shared/components/ui';
import type { AdminUserDTO } from '@/shared/contracts/admin-ops.contract';
import { ROLE_LABELS, USER_ROLES, type UserRole } from '@/shared/rbac';
import { useAuthStore } from '@/features/auth/store/auth.store';

const egyptianPhone = /^01[0125][0-9]{8}$/;

const formSchema = z.object({
  name: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || egyptianPhone.test(v), {
      message: 'Enter a valid Egyptian mobile number',
    }),
  role: z.enum(USER_ROLES),
});

type FormValues = z.infer<typeof formSchema>;

export interface UserFormSubmit {
  name: string;
  phone: string | null;
  role: UserRole;
}

interface UserFormProps {
  initial: AdminUserDTO;
  onSubmit: (values: UserFormSubmit) => Promise<void>;
  isLoading?: boolean;
  /** Hide role change when editing self (server still guards). */
  lockRole?: boolean;
}

export function UserForm({
  initial,
  onSubmit,
  isLoading,
  lockRole,
}: UserFormProps) {
  const me = useAuthStore((s) => s.user);
  const canAssignAdmin = me?.role === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: initial.name,
      phone: initial.phone ?? '',
      role: initial.role,
    },
  });

  const roleOptions = USER_ROLES.filter((role) => {
    if (role === 'admin') return canAssignAdmin || initial.role === 'admin';
    return true;
  });

  return (
    <form
      className="max-w-md space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          name: values.name,
          phone: values.phone === '' ? null : values.phone,
          role: values.role,
        });
      })}
    >
      <Input label="Email" value={initial.email} disabled readOnly />
      <Input label="Name" error={errors.name?.message} {...register('name')} />
      <Input
        label="Phone"
        placeholder="01xxxxxxxxx"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Select
        label="Role"
        error={errors.role?.message}
        disabled={lockRole}
        {...register('role')}
      >
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </Select>
      {lockRole ? (
        <p className="text-xs text-text-muted">
          You cannot change your own role here.
        </p>
      ) : null}
      <Button type="submit" isLoading={isLoading}>
        Save changes
      </Button>
    </form>
  );
}
