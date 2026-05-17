import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminExercise {
  id: string;
  topic: string;
  level: string;
  type: 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'IDENTIFY' | 'TRANSLATE' | 'FREE_WRITE';
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timesShown: number;
  timesCorrect: number;
}

export interface ExerciseStats {
  total: number;
  byTopic: Record<string, { EASY: number; MEDIUM: number; HARD: number; total: number }>;
}

export interface ExercisePage {
  data: AdminExercise[];
  total: number;
  page: number;
  pages: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get<ExerciseStats>('/admin/exercises/stats');
      return res.data;
    },
  });
}

export function useAdminExercises(filters: {
  topic?: string;
  type?: string;
  difficulty?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'exercises', filters],
    queryFn: async () => {
      const res = await api.get<ExercisePage>('/admin/exercises', { params: filters });
      return res.data;
    },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdminExercise> }) => {
      const res = await api.put<AdminExercise>(`/admin/exercises/${id}`, data);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/exercises/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useDeleteAllExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ deleted: number }>('/admin/exercises/all');
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useImportExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exercises: Omit<AdminExercise, 'id' | 'timesShown' | 'timesCorrect'>[]) => {
      const res = await api.post<{ imported: number }>('/admin/exercises/import', { exercises });
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}
