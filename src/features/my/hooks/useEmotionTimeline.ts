import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useEmotionTimeline(days = 7, enabled = true) {
  return useQuery({
    queryKey: ['emotionTimeline', days],
    queryFn: () => api.getEmotionTimeline(days),
    enabled,
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });
}
