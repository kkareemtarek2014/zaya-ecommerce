import type { Metadata } from 'next';
import { ProfileForm } from '@/features/account';

export const metadata: Metadata = { title: 'My Profile' };

export default function ProfilePage() {
  return <ProfileForm />;
}
