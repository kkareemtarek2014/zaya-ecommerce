import { Metadata } from 'next';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Register a new Zaya account.',
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-serif text-text-primary text-center mb-6">Create Account</h1>
      <RegisterForm />
    </>
  );
}
