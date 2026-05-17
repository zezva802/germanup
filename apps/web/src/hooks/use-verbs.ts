import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ConjugationMap {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

export interface ConjugationStat {
  id: string;
  verbId: string;
  pronoun: string;
  tense: string;
  attempts: number;
  correct: number;
}

export interface UserVerb {
  id: string;
  infinitive: string;
  isIrregular: boolean;
  praesens: ConjugationMap;
  imperfekt: ConjugationMap;
  partizip2: string;
  hilfsverb: string;
  example: string;
  createdAt: string;
  conjugationStats: ConjugationStat[];
}

export interface PracticeItem {
  verbId: string;
  infinitive: string;
  pronoun: string;
  tense: string;
  answer: string;
}

export function useVerbs() {
  return useQuery({
    queryKey: ['verbs'],
    queryFn: async () => {
      const res = await api.get<UserVerb[]>('/verbs');
      return res.data;
    },
  });
}

export function useImportVerb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (infinitive: string) => {
      const res = await api.post<UserVerb>('/verbs/import', { infinitive });
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['verbs'] }),
  });
}

export function useDeleteVerb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/verbs/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['verbs'] }),
  });
}

export function usePracticeSession(params: {
  verbIds: string[];
  tense?: 'praesens' | 'imperfekt' | 'both';
}) {
  return useQuery({
    queryKey: ['verb-practice', params],
    queryFn: async () => {
      const res = await api.get<PracticeItem[]>('/verbs/practice-session', {
        params: {
          verbIds: params.verbIds,
          tense: params.tense,
        },
        paramsSerializer: (p) => {
          const parts: string[] = [];
          if (Array.isArray(p.verbIds)) {
            p.verbIds.forEach((id: string) => parts.push(`verbIds=${encodeURIComponent(id)}`));
          }
          if (p.tense) parts.push(`tense=${p.tense}`);
          return parts.join('&');
        },
      });
      return res.data;
    },
    enabled: params.verbIds.length > 0,
  });
}

export function useConjugationResult() {
  return useMutation({
    mutationFn: async (data: {
      verbId: string;
      pronoun: string;
      tense: string;
      correct: boolean;
    }) => {
      await api.post('/verbs/conjugation-result', data);
    },
  });
}
