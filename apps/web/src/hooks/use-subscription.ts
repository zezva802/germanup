import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SubscriptionStatus {
  plan: 'FREE' | 'PRO';
  currentPeriodEnd: string | null;
  status: string | null;
}

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await api.get<SubscriptionStatus>('/subscription/status');
      return res.data;
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ url: string }>('/subscription/checkout');
      return res.data;
    },
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ url: string }>('/subscription/portal');
      return res.data;
    },
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}
