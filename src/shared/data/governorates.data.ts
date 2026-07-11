import type { ShippingZone } from '@/config/site.config';

export interface Governorate {
  id: string;
  name: string;
  zone: ShippingZone;
}

/** All 27 Egyptian governorates mapped to a delivery zone. */
export const GOVERNORATES: Governorate[] = [
  { id: 'cairo', name: 'Cairo', zone: 'cairo_giza' },
  { id: 'giza', name: 'Giza', zone: 'cairo_giza' },
  { id: 'alexandria', name: 'Alexandria', zone: 'near' },
  { id: 'qalyubia', name: 'Qalyubia', zone: 'near' },
  { id: 'sharqia', name: 'Sharqia', zone: 'near' },
  { id: 'dakahlia', name: 'Dakahlia', zone: 'near' },
  { id: 'gharbia', name: 'Gharbia', zone: 'near' },
  { id: 'menoufia', name: 'Menoufia', zone: 'near' },
  { id: 'beheira', name: 'Beheira', zone: 'near' },
  { id: 'kafr-el-sheikh', name: 'Kafr El Sheikh', zone: 'near' },
  { id: 'damietta', name: 'Damietta', zone: 'near' },
  { id: 'port-said', name: 'Port Said', zone: 'near' },
  { id: 'ismailia', name: 'Ismailia', zone: 'near' },
  { id: 'suez', name: 'Suez', zone: 'near' },
  { id: 'faiyum', name: 'Faiyum', zone: 'near' },
  { id: 'beni-suef', name: 'Beni Suef', zone: 'near' },
  { id: 'minya', name: 'Minya', zone: 'far' },
  { id: 'assiut', name: 'Assiut', zone: 'far' },
  { id: 'sohag', name: 'Sohag', zone: 'far' },
  { id: 'qena', name: 'Qena', zone: 'far' },
  { id: 'luxor', name: 'Luxor', zone: 'far' },
  { id: 'aswan', name: 'Aswan', zone: 'far' },
  { id: 'red-sea', name: 'Red Sea', zone: 'far' },
  { id: 'new-valley', name: 'New Valley', zone: 'far' },
  { id: 'matrouh', name: 'Matrouh', zone: 'far' },
  { id: 'north-sinai', name: 'North Sinai', zone: 'far' },
  { id: 'south-sinai', name: 'South Sinai', zone: 'far' },
];

export function getGovernorate(id: string): Governorate | undefined {
  return GOVERNORATES.find((g) => g.id === id);
}
