import { useQuery } from '@tanstack/react-query';
import { getWeeklyEmotionSummary } from '@/shared/lib/api/my';

export function useWeeklySummary(weekOffset = 0, enabled = true) {
  return useQuery({
    queryKey: ['weeklySummary', weekOffset],
    queryFn: () => getWeeklyEmotionSummary(weekOffset),
    enabled,
    staleTime: 30 * 60 * 1000, // 30분
  });
}
