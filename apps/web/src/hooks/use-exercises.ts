import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Exercise } from '@germanup/types';

interface GetExercisesParams {
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'mixed';
  type?: string;
  limit?: number;
}

export function useExercises(params: GetExercisesParams, enabled = true) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: async () => {
      const res = await api.get<Exercise[]>('/exercises', { params });
      return res.data;
    },
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSubmitResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { exerciseId: string; correct: boolean; topic: string }) => {
      const res = await api.post<{ success: boolean; unlockedNextTopic: boolean }>(
        '/exercises/result',
        data,
      );
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['progress'] }),
  });
}

export function useCorrectTranslation() {
  return useMutation({
    mutationFn: async (data: { topic: string; task: string; studentAnswer: string }) => {
      const res = await api.post('/exercises/correct-translation', data);
      return res.data;
    },
  });
}

export function useCorrectFreewrite() {
  return useMutation({
    mutationFn: async (data: {
      topic: string;
      task?: string;
      requiredElements: string[];
      studentAnswer: string;
    }) => {
      const res = await api.post('/exercises/correct-freewrite', data);
      return res.data;
    },
  });
}
