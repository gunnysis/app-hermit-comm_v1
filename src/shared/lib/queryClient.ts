import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import Toast from 'react-native-toast-message';

const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: 1000 * 60 * 60 * 12, // 12시간
});

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      Toast.show({
        type: 'error',
        text1: error.message || '데이터를 불러올 수 없어요',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      Toast.show({
        type: 'error',
        text1: error.message || '요청에 실패했어요',
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      persister: persister.persisterFn,
    },
    mutations: {
      retry: 1,
    },
  },
});
