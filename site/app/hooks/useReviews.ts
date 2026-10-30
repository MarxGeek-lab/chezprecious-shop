'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, type CreateReviewPayload, type UpdateReviewPayload } from '@/app/lib/api';

export function useSellerReviews(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['seller', 'reviews', params],
    queryFn: async () => {
      const { data } = await reviewsApi.sellerList(params);
      return data;
    },
  });
}

export function useProductReviews(
  productId: string | null,
  params?: { page?: number; limit?: number; sort?: string }
) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await reviewsApi.list({ productId, ...params });
      return data;
    },
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReviewPayload) => {
      const { data: result } = await reviewsApi.create(data);
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'product'] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReviewPayload }) => {
      const { data: result } = await reviewsApi.update(id, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await reviewsApi.delete(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'reviews'] });
    },
  });
}

export function useMarkHelpful() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await reviewsApi.helpful(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
