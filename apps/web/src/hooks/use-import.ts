import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ImportPreviewResponse,
  ImportCommitResponse,
  PartOfSpeech,
} from '@/types/words';

export function useImportPreview() {
  return useMutation({
    mutationFn: async (data: { text: string; deckId?: string }) => {
      const res = await api.post<ImportPreviewResponse>('/words/import/preview', data);
      return res.data;
    },
  });
}

/** DOG-117: Pro extract-from-text. Returns the same preview shape as import preview. */
export function useExtract() {
  return useMutation({
    mutationFn: async (data: { text: string; deckId?: string }) => {
      const res = await api.post<ImportPreviewResponse>('/words/extract', data);
      return res.data;
    },
  });
}

export interface CommitRow {
  german: string;
  english: string;
  gender?: string | null;
  plural?: string | null;
  example?: string | null;
  partOfSpeech?: PartOfSpeech;
  level?: string;
  source?: string;
  status?: string;
  override?: boolean;
}

export function useImportCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { deckId: string; tagIds?: string[]; rows: CommitRow[] }) => {
      const res = await api.post<ImportCommitResponse>('/words/import/commit', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['words'] });
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['deck'] });
    },
  });
}
