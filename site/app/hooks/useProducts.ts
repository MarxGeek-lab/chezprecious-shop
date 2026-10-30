'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productsApi,
  type ProductListParams,
  type ApiProduct,
} from '@/app/lib/api';

// ==========================================
// Seller — Produits du vendeur
// ==========================================

export function useSellerProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['seller', 'products', params],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return null;
      const { data } = await productsApi.list(params);
      return data;
    },
    retry: false,
  });
}

export function useSellerProduct(id: string | null) {
  return useQuery({
    queryKey: ['seller', 'product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await productsApi.get(id);
      return data.product;
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await productsApi.create(formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { data } = await productsApi.update(id, formData);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await productsApi.delete(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await productsApi.deleteImage(productId, imageId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'product'] });
    },
  });
}

export function useDeleteProductVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, videoId }: { productId: string; videoId: string }) => {
      const { data } = await productsApi.deleteVideo(productId, videoId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'product'] });
    },
  });
}

export function useSetMainImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await productsApi.setMainImage(productId, imageId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'product'] });
    },
  });
}

// ==========================================
// Public — Catalogue
// ==========================================

export function usePublicProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: async () => {
      const { data } = await productsApi.publicList(params);
      return data;
    },
  });
}

export function usePublicProduct(slug: string | null) {
  return useQuery({
    queryKey: ['catalog', 'product', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await productsApi.publicShow(slug);
      return data.product;
    },
    enabled: !!slug,
  });
}

export function useSimilarProducts(slug: string | null, limit?: number) {
  return useQuery({
    queryKey: ['catalog', 'similar', slug, limit],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await productsApi.publicSimilar(slug, limit);
      return data.products;
    },
    enabled: !!slug,
  });
}
