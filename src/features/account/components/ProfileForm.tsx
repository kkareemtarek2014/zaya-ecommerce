'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useProfileStore } from '../store/profile.store';

const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'Enter a valid Egyptian mobile'),
  email: z.email('Enter a valid email').or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const mounted = useHydrated();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile,
  });

  if (!mounted) return null;

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4"
      noValidate
    >
      <Input
        label="Full name"
        placeholder="Mariam Ahmed"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Mobile number"
        placeholder="01012345678"
        inputMode="numeric"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        label="Email (optional)"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit">
        {saved ? (
          <>
            <Check className="size-4" /> Saved
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  );
}
