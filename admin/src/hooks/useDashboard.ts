'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/src/lib/api';

export interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  pendingSellers: number;
  activeProducts: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user: { fullName: string | null; email: string };
  }>;
}

export function useDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/admin/dashboard');
      return data;
    },
    refetchInterval: 60_000, // refresh toutes les 60s
  });
}
