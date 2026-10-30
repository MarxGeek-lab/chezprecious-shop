'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';

const TEAM_KEY = ['admin', 'team'];

export interface AdminMember {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamResponse {
  admins: AdminMember[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export function useTeam(page = 1, search = '') {
  return useQuery({
    queryKey: [...TEAM_KEY, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get<TeamResponse>(`/admin/team?${params}`);
      return data;
    },
  });
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; fullName?: string; role?: string }) => {
      const { data } = await api.post('/admin/team/invite', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; fullName?: string; phone?: string; isActive?: boolean }) => {
      const { data } = await api.put(`/admin/team/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/team/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}

export function useToggleAdminActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/admin/team/${id}/toggle-active`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}

export function useResendSetupLink() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/team/${id}/resend-setup`);
      return data;
    },
  });
}

// Routes publiques (sans auth)
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/admin/auth/request-reset', { email });
      return data;
    },
  });
}

export function useVerifyToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post('/admin/auth/verify-token', { token });
      return data;
    },
  });
}

export function useSetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const { data } = await api.post('/admin/auth/set-password', payload);
      return data;
    },
  });
}
