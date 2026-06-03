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

/** DOG-117: Pro AI deck generation. Returns the new deck detail (with its words). */
export function useGenerateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { topic: string; level?: string; count?: number }) => {
      const res = await api.post<DeckDetail>('/decks/generate', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['words'] });
    },
  });
}

/** DOG-120: fetch a portable JSON export of a deck the caller can see. */
export function useExportDeck() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/decks/${id}/export`);
      return res.data as Record<string, unknown>;
    },
  });
}

/** DOG-120: import a deck export envelope as a new owned deck. */
export function useImportDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post<DeckDetail>('/decks/import', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['words'] });
    },
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
