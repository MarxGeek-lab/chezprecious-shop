'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginPayload, type RegisterPayload, type ForgotPasswordPayload, type ResetPasswordPayload, type AuthUser } from '@/app/lib/api';
import { useCallback } from 'react';

// ==========================================
// Hook : useCurrentUser
// ==========================================
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return null;

      // Membre d'équipe : le token STORE_MEMBER ne passe pas /auth/me
      // On reconstruit l'AuthUser depuis les données stockées au login
      const teamMemberRaw = typeof window !== 'undefined' ? localStorage.getItem('team_member') : null;
      if (teamMemberRaw) {
        try {
          const member = JSON.parse(teamMemberRaw);
          return {
            id: member.id,
            email: member.email,
            fullName: member.fullName,
            role: 'STORE_MEMBER',
            avatar: member.storeLogo ?? null,
            phone: null,
            isMember: true,
            memberRole: member.role,
            storeId: member.storeId,
            storeName: member.storeName,
            storeSlug: member.storeSlug,
            storeLogo: member.storeLogo,
          };
        } catch {
          localStorage.removeItem('team_member');
        }
      }

      const { data } = await authApi.me();
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// Hook : useLogin
// ==========================================
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await authApi.login(payload);
      return data;
    },
    onSuccess: (data) => {
      // Si un token est renvoyé (flow confirmLogin), on connecte directement
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        queryClient.setQueryData(['auth', 'me'], data.user);
      }
      // Si requiresConfirmation, la page gère l'affichage du message
    },
  });
}

// ==========================================
// Hook : useConfirmLogin
// ==========================================
export function useConfirmLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await authApi.confirmLogin(token);
      return data;
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        queryClient.setQueryData(['auth', 'me'], data.user);
      }
    },
  });
}

// ==========================================
// Hook : useRegister
// ==========================================
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await authApi.register(payload);
      return data;
    },
  });
}

// ==========================================
// Hook : useForgotPassword
// ==========================================
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const { data } = await authApi.forgotPassword(payload);
      return data;
    },
  });
}

// ==========================================
// Hook : useResetPassword
// ==========================================
export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const { data } = await authApi.resetPassword(payload);
      return data;
    },
  });
}

// ==========================================
// Hook : useActivateAccount
// ==========================================
export function useActivateAccount() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await authApi.activateAccount(token);
      return data;
    },
  });
}

// ==========================================
// Hook : useVerifyEmail
// ==========================================
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await authApi.verifyEmail(email);
      return data;
    },
  });
}

// ==========================================
// Hook : useLogout
// ==========================================
export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Silencieux
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('team_member');
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  }, [queryClient]);
}
