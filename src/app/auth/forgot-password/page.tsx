import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Zaya account password.',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-serif text-text-primary text-center mb-6">Reset Password</h1>
      <ForgotPasswordForm />
    </>
  );
}
