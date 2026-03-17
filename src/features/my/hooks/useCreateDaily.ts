import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useCreateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDailyPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayDaily'] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['dailyInsights'] });
      queryClient.invalidateQueries({ queryKey: ['myStreak'] });
    },
  });
}

export function useUpdateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateDailyPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayDaily'] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
      queryClient.invalidateQueries({ queryKey: ['activitySummary'] });
      queryClient.invalidateQueries({ queryKey: ['dailyInsights'] });
      queryClient.invalidateQueries({ queryKey: ['myStreak'] });
    },
  });
}
