import { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in to your Zaya account.',
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-serif text-text-primary text-center mb-6">Welcome Back</h1>
      <LoginForm />
    </>
  );
}
