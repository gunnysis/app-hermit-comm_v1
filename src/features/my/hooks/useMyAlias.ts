import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useMyAlias(enabled = true) {
  return useQuery({
    queryKey: ['myAlias'],
    queryFn: api.getMyAlias,
    enabled,
    staleTime: 60 * 60 * 1000,
    meta: { silent: true },
  });
}
