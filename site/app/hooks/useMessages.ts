import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/app/lib/api';

// ── Admin side ────────────────────────────────────────────────────────────────

export function useSellerConversations() {
  return useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const res = await messagesApi.conversations();
      return res.data.conversations;
    },
    refetchInterval: 30_000,
  });
}

export function useMessageThread(customerEmail: string | null) {
  return useQuery({
    queryKey: ['admin-thread', customerEmail],
    queryFn: async () => {
      if (!customerEmail) return [];
      const res = await messagesApi.thread(customerEmail);
      return res.data.messages;
    },
    enabled: !!customerEmail,
    refetchInterval: 15_000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { customerEmail: string; customerName: string; body: string }) =>
      messagesApi.send(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thread', variables.customerEmail] });
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
    },
  });
}

export function useUnreadMessagesCount() {
  return useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: async () => {
      const res = await messagesApi.unreadCount();
      return res.data.count;
    },
    refetchInterval: 60_000,
  });
}

// ── Customer side ─────────────────────────────────────────────────────────────

export function useCustomerConversations() {
  return useQuery({
    queryKey: ['customer-conversations'],
    queryFn: async () => {
      const res = await messagesApi.customerConversations();
      return res.data.conversations;
    },
    refetchInterval: 30_000,
  });
}

export function useCustomerThread() {
  return useQuery({
    queryKey: ['customer-thread'],
    queryFn: async () => {
      const res = await messagesApi.customerThread();
      return res.data;
    },
    refetchInterval: 15_000,
  });
}

export function useCustomerSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { body: string }) => messagesApi.customerSend(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-thread'] });
      queryClient.invalidateQueries({ queryKey: ['customer-conversations'] });
    },
  });
}

export function useCustomerUnreadCount() {
  return useQuery({
    queryKey: ['customer-unread-count'],
    queryFn: async () => {
      const res = await messagesApi.customerConversations();
      return res.data.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    },
    refetchInterval: 60_000,
  });
}
