import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Word, PaginatedResponse, PartOfSpeech } from '@/types/words';

export interface WordsQuery {
  deck?: string;
  tag?: string;
  search?: string;
  partOfSpeech?: PartOfSpeech;
  page?: number;
  limit?: number;
}

export function useWords(params: WordsQuery) {
  return useQuery({
    queryKey: ['words', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Word>>('/words', { params });
      return res.data;
    },
  });
}

export interface WordInput {
  deckId: string;
  german: string;
  english: string;
  gender?: string | null;
  plural?: string | null;
  example?: string | null;
  partOfSpeech?: PartOfSpeech;
  level?: string;
}

export function useCreateWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: WordInput) => {
      const res = await api.post<Word>('/words', data);
      return res.data;
    },
    onSuccess: () => invalidateWords(qc),
  });
}

export function useUpdateWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<WordInput> & { id: string; tagIds?: string[] }) => {
      const res = await api.patch<Word>(`/words/${id}`, data);
      return res.data;
    },
    onSuccess: () => invalidateWords(qc),
  });
}

export function useDeleteWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/words/${id}`);
    },
    onSuccess: () => invalidateWords(qc),
  });
}

function invalidateWords(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['words'] });
  void qc.invalidateQueries({ queryKey: ['decks'] }); // word counts
  void qc.invalidateQueries({ queryKey: ['deck'] });
}
