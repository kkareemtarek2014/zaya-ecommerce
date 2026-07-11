export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  governorate: string; // Governorate id
  city: string;
  street: string;
  notes?: string;
}

export type PaymentMethod = 'cod';

export interface Order {
  id: string;
  createdAt: string; // ISO date
  items: OrderItem[];
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  total: number;
}
