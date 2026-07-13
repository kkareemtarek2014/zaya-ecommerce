'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useLogin, useLogout } from '@/features/auth/hooks/useAuth';
import { loginSchema, type LoginValues } from '@/features/auth/schema/auth.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isStaffRole } from '@/shared/rbac';

export function AdminLoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const loggedIn = await loginMutation.mutateAsync(values);
      if (!isStaffRole(loggedIn.role)) {
        await logoutMutation.mutateAsync();
        setFormError('This account does not have admin access.');
        return;
      }
      router.replace(redirect.startsWith('/admin') ? redirect : '/admin');
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formError && <p className="text-sm text-status-error">{formError}</p>}
      {user && !isStaffRole(user.role) ? (
        <p className="text-sm text-text-secondary">
          Signed in as {user.email}, but this account is not staff.
        </p>
      ) : null}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button
        type="submit"
        isLoading={loginMutation.isPending || logoutMutation.isPending}
        className="w-full"
      >
        Sign in to Admin
      </Button>
      <p className="text-center text-sm text-text-muted">
        <Link
          href="/"
          className="underline-offset-4 hover:text-brand-accent hover:underline"
        >
          Back to storefront
        </Link>
      </p>
    </form>
  );
}
