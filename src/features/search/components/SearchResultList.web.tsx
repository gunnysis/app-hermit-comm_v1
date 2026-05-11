import React from 'react';
import { View, FlatList } from 'react-native';
import { PostCardSkeleton } from '@/shared/components/primitives/Skeleton';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult } from '@/types';

export function SearchResultList({
  results,
  onEndReached,
  isFetchingMore,
}: {
  results: SearchResult[];
  onEndReached: () => void;
  isFetchingMore: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SearchResultCard result={item} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingMore ? (
            <View className="py-4">
              {[1, 2].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />
    </View>
  );
}
