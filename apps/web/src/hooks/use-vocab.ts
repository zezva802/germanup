import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VocabWord, PaginatedResponse } from '@germanup/types';

export function useVocab(params?: { level?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['vocab', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<VocabWord>>('/vocab', { params });
      return res.data;
    },
  });
}

export function useImportWords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (words: string[]) => {
      const res = await api.post<VocabWord[]>('/vocab/import', { words });
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vocab'] }),
  });
}

export function useDeleteWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/vocab/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vocab'] }),
  });
}

export function useFlashcardSession(params: { size: number; level?: string }) {
  return useQuery({
    queryKey: ['flashcard-session', params],
    queryFn: async () => {
      const res = await api.get<VocabWord[]>('/vocab/flashcard-session', { params });
      return res.data;
    },
  });
}

export interface WiktionaryResult {
  found: boolean;
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
}

export function useWordLookup(word: string) {
  return useQuery({
    queryKey: ['vocab-lookup', word],
    queryFn: async () => {
      const res = await api.get<WiktionaryResult>('/vocab/lookup', { params: { word } });
      return res.data;
    },
    enabled: word.trim().length > 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      german: string;
      english: string;
      level: string;
      gender?: string;
      plural?: string;
    }) => {
      const res = await api.post<VocabWord>('/vocab/add', data);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['vocab'] }),
  });
}

export function useFlashcardResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wordId, knew }: { wordId: string; knew: boolean }) => {
      await api.post('/vocab/flashcard-result', { wordId, knew });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['flashcard-session'] }),
  });
}
