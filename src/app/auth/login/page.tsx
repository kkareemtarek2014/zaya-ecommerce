import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth';
import { Loader } from '@/shared/components/ui';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in to your Sqoosh account.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader fullscreen={false} className="p-8" />}>
      <LoginForm />
    </Suspense>
  );
}
