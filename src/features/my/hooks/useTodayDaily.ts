import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useTodayDaily(enabled = true) {
  return useQuery({
    queryKey: ['todayDaily'],
    queryFn: api.getTodayDaily,
    enabled,
    staleTime: 60_000,
  });
}
