// ==============================================
// HOOK NOTIFICATIONS
// ==============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/app/lib/api';

const QUERY_KEY = 'notifications';

// ── Liste paginée ──────────────────────────────
export function useNotifications(params?: { page?: number; limit?: number; unread?: boolean }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await notificationsApi.list(params);
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Compteur non lus (polling toutes les 60s) ──
export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: [QUERY_KEY, 'unread-count'],
    queryFn: async () => {
      const { data } = await notificationsApi.unreadCount();
      return data.count;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ── Marquer une notif comme lue ────────────────
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Tout marquer comme lu ──────────────────────
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Supprimer une notification ────────────────
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Supprimer toutes les notifs lues ──────────
export function useDeleteReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.deleteRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
