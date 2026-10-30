'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressesApi, type CreateAddressPayload, type UpdateAddressPayload } from '@/app/lib/api';

const QUERY_KEY = ['user', 'addresses'];

// ==========================================
// Hook : useAddresses — liste des adresses
// ==========================================
export function useAddresses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return { addresses: [] };
      const { data } = await addressesApi.list();
      return data;
    },
    retry: false,
  });
}

// ==========================================
// Hook : useCreateAddress
// ==========================================
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAddressPayload) => {
      const { data: result } = await addressesApi.create(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ==========================================
// Hook : useUpdateAddress
// ==========================================
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAddressPayload }) => {
      const { data: result } = await addressesApi.update(id, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ==========================================
// Hook : useDeleteAddress
// ==========================================
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await addressesApi.delete(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ==========================================
// Hook : useSetDefaultAddress
// ==========================================
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await addressesApi.setDefault(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
