import { useQuery } from '@tanstack/react-query';
import { getMyStreak } from '@/shared/lib/api/my';

export function useStreak(enabled = true) {
  return useQuery({
    queryKey: ['myStreak'],
    queryFn: getMyStreak,
    enabled,
    staleTime: 60 * 1000, // 1분
  });
}
