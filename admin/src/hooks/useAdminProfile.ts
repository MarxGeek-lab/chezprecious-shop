'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { useAdminAuth } from '@/src/context/AdminAuthContext';

export function useAdminProfile() {
  return useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/admin/auth/me');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { updateAdmin } = useAdminAuth();
  return useMutation({
    mutationFn: async (payload: { fullName?: string; phone?: string; avatar?: string }) => {
      const { data } = await api.put('/admin/auth/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      updateAdmin(data.admin);
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.put('/admin/auth/password', payload);
      return data;
    },
  });
}
