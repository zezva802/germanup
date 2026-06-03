import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DeckSummary, DeckDetail } from '@/types/words';

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      const res = await api.get<DeckSummary[]>('/decks');
      return res.data;
    },
  });
}

export function useDeck(id: string) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: async () => {
      const res = await api.get<DeckDetail>(`/decks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; topic?: string; level?: string }) => {
      const res = await api.post<DeckSummary>('/decks', data);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; topic?: string; level?: string }) => {
      const res = await api.patch(`/decks/${id}`, data);
      return res.data;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['deck', vars.id] });
    },
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/decks/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['words'] });
    },
  });
}

export function useStartDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ enrolled: number; totalWords: number }>(`/decks/${id}/start`);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['decks'] }),
  });
}
