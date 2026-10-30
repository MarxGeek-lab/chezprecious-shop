'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, type UpdateUserProfilePayload, type UpdateUserPasswordPayload } from '@/app/lib/api';
import { useLogout } from '@/app/hooks/useAuth';

// ==========================================
// Hook : useMyReviews — Avis de l'utilisateur connecté
// ==========================================
export function useMyReviews() {
  return useQuery({
    queryKey: ['user', 'reviews'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return { reviews: [] };
      const { data } = await userApi.myReviews();
      return data;
    },
    retry: false,
  });
}

// ==========================================
// Hook : useUpdateUserProfile
// ==========================================
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserProfilePayload) => {
      const { data: result } = await userApi.updateProfile(data);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    },
  });
}

// ==========================================
// Hook : useUpdateUserPassword
// ==========================================
export function useUpdateUserPassword() {
  const logout = useLogout();

  return useMutation({
    mutationFn: async (data: UpdateUserPasswordPayload) => {
      const { data: result } = await userApi.updatePassword(data);
      return result;
    },
    onSuccess: (data) => {
      // Remplacer le token par le nouveau (toutes les autres sessions sont invalidées)
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      // Déconnecter après un court délai pour que le message de succès soit visible
      setTimeout(() => {
        logout();
      }, 2000);
    },
  });
}

// ==========================================
// Hook : useUpdateUserAvatar
// ==========================================
export function useUpdateUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (avatarUrl: string) => {
      const { data: result } = await userApi.updateAvatar(avatarUrl);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    },
  });
}
