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

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'sourced'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  createdAt: string; // ISO date
  status: OrderStatus;
  items: OrderItem[];
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  total: number;
  note?: string; // Adding for Task 5
}
