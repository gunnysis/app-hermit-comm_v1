import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Post } from '@/types';
import { PostCard } from './PostCard';
import { PostCardSkeleton } from '@/shared/components/primitives/Skeleton';
import { Loading } from '@/shared/components/primitives/Loading';
import { ErrorView } from '@/shared/components/composed/ErrorView';
import { EmptyState } from '@/shared/components/primitives/EmptyState';

const renderPostCard = ({ item }: { item: Post }) => <PostCard post={item} />;

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  listHeader?: React.ReactElement;
}

export function PostList({
  posts,
  loading,
  error,
  onRefresh,
  onLoadMore,
  hasMore = true,
  emptyTitle,
  emptyDescription,
  listHeader,
}: PostListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleEndReached = useCallback(() => {
    if (!onLoadMore || !hasMore || loading) return;
    onLoadMore();
  }, [onLoadMore, hasMore, loading]);

  const ListFooter = useCallback(() => {
    if (loading && posts.length > 0) {
      return (
        <View className="py-5">
          <Loading size="small" />
        </View>
      );
    }
    return null;
  }, [loading, posts.length]);

  const ListEmpty = useCallback(
    () => (
      <EmptyState
        icon="📝"
        title={emptyTitle ?? '아직 글이 없어요'}
        description={emptyDescription ?? '첫 번째 글을 남겨보세요.'}
      />
    ),
    [emptyTitle, emptyDescription],
  );

  if (loading && posts.length === 0) {
    return (
      <View className="p-4 web:max-w-2xl web:mx-auto web:w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error && posts.length === 0) {
    return <ErrorView message={error} onRetry={onRefresh} />;
  }

  return (
    <View style={{ flex: 1 }} className="web:max-w-2xl web:mx-auto web:w-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFC300"
            colors={['#FFC300', '#FF7366', '#C39BFF']}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />
    </View>
  );
}
