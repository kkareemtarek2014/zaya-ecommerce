import { adminActivityItemSchema } from '@/shared/contracts/admin-ops-activity.contract';
import { z } from 'zod';
import { orderStatusSchema } from '@/shared/contracts/order.contract';
import { adminOrderDtoSchema } from '@/shared/contracts/admin-ops.contract';
import { adminProductDtoSchema } from '@/shared/contracts/admin-catalog.contract';

export const adminStatsDtoSchema = z.object({
  revenueTotal: z.number().int(),
  revenueToday: z.number().int(),
  revenueThisMonth: z.number().int(),
  avgOrderValue: z.number().int(),
  ordersCount: z.number().int(),
  productsCount: z.number().int(),
  usersCount: z.number().int(),
  newCustomers: z.number().int(),
  ordersByStatus: z.record(orderStatusSchema, z.number().int()),
  recentOrders: z.array(adminOrderDtoSchema),
  latestProducts: z.array(adminProductDtoSchema),
  lowStockProducts: z.array(adminProductDtoSchema),
  bestSellers: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      image: z.string().optional(),
      qty: z.number().int(),
      revenue: z.number().int(),
    }),
  ),
  mostViewed: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      image: z.string().optional(),
      views: z.number().int(),
    }),
  ),
  topCategories: z.array(
    z.object({
      category: z.string(),
      qty: z.number().int(),
      revenue: z.number().int(),
    }),
  ),
  recentActivity: z.array(adminActivityItemSchema).optional(),
  salesByDay: z.array(
    z.object({
      date: z.string(),
      total: z.number().int(),
    }),
  ),
});

export type AdminStatsDTO = z.infer<typeof adminStatsDtoSchema>;
