import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReviewQueue, GradeResult, ReviewGrade, ReviewMode, WordsStats, AdvancedStats } from '@/types/words';

export function useWordsStats() {
  return useQuery({
    queryKey: ['words-stats'],
    queryFn: async () => {
      const res = await api.get<WordsStats>('/words/stats');
      return res.data;
    },
  });
}

/** DOG-118: Pro advanced stats. Pass enabled=false for Free users so no call fires. */
export function useAdvancedStats(enabled: boolean) {
  return useQuery({
    queryKey: ['words-stats-advanced'],
    queryFn: async () => {
      const res = await api.get<AdvancedStats>('/words/stats/advanced');
      return res.data;
    },
    enabled,
  });
}

/** Fetch the due+new queue once per session (staleTime avoids refetch mid-session). */
export function useReviewQueue(deck?: string) {
  return useQuery({
    queryKey: ['review-queue', deck ?? null],
    queryFn: async () => {
      const res = await api.get<ReviewQueue>('/review/queue', { params: deck ? { deck } : {} });
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** DOG-121: suspend/unsuspend a card (excludes it from the study queue). */
export function useSuspendCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { wordId: string; suspended: boolean }) => {
      const res = await api.post<{ wordId: string; suspended: boolean }>('/review/suspend', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['words-stats-advanced'] });
      void qc.invalidateQueries({ queryKey: ['words-stats'] });
      void qc.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useGradeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { wordId: string; grade: ReviewGrade; mode: ReviewMode }) => {
      const res = await api.post<GradeResult>('/review/grade', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['words-stats'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
