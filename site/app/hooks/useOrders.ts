import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type CreateOrderPayload } from '@/app/lib/api';

/**
 * Hook pour créer une commande
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderPayload) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook pour récupérer mes commandes
 */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersApi.list();
      return response.data.orders;
    },
  });
}

/**
 * Hook pour récupérer le détail d'une commande
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await ordersApi.show(id);
      return response.data.order;
    },
    enabled: !!id,
  });
}

/**
 * Hook pour récupérer les commandes du seller
 * @param params - filtres optionnels { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
export function useSellerOrders(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['seller-orders', params],
    queryFn: async () => {
      const response = await ordersApi.sellerOrders(params);
      return response.data.orders;
    },
  });
}
