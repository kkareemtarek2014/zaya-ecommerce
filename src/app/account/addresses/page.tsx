import type { Metadata } from 'next';
import { AddressBook } from '@/features/account';

export const metadata: Metadata = { title: 'My Addresses' };

export default function AddressesPage() {
  return <AddressBook />;
}
