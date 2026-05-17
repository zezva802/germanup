import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TopicProgressItem {
  topic: string;
  level: string;
  exercisesDone: number;
  correctCount: number;
  lastPracticed: string | null;
  unlocked: boolean;
  percentCorrect: number;
}

export interface ProgressSummary {
  topics: TopicProgressItem[];
  streak: number;
  calendarDays: string[];
  totalExercisesDone: number;
  overallPercent: number;
}

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const res = await api.get<ProgressSummary>('/progress');
      return res.data;
    },
  });
}

export function useTopicProgress(topic: string) {
  return useQuery({
    queryKey: ['progress', topic],
    queryFn: async () => {
      const res = await api.get<TopicProgressItem>(`/progress/${topic}`);
      return res.data;
    },
  });
}

export interface TodayStats {
  exercisesToday: number;
  dailyGoal: number;
  goalReached: boolean;
  streakCount: number;
  freezeAvailable: boolean;
}

export function useTodayStats() {
  return useQuery({
    queryKey: ['progress', 'today'],
    queryFn: async () => {
      const res = await api.get<TodayStats>('/progress/today');
      return res.data;
    },
    refetchInterval: 30_000,
  });
}
