import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Badge = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface ChallengeResult {
  challengeSlug: string;
  badge: Badge | null;
  bestScore: number | null;
  playsCount: number;
}

export interface SavedChallengeResult {
  id: string;
  challengeSlug: string;
  score: number;
  badge: Badge | null;
  completedAt: string;
}

export function useChallengeResults() {
  return useQuery({
    queryKey: ['challenge-results'],
    queryFn: async () => {
      // GET /challenges/results returns the per-challenge best-badge array.
      const res = await api.get<ChallengeResult[]>('/challenges/results');
      return res.data;
    },
  });
}

export function useSaveChallengeResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { challengeSlug: string; score: number }) => {
      const res = await api.post<SavedChallengeResult>('/challenges/result', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-results'] });
    },
  });
}
