import React from 'react';
import { View, FlatList } from 'react-native';
import { PostCard } from '@/features/posts/components/PostCard';
import type { Post } from '@/types';

export function EmotionPostList({ posts }: { posts: Post[] }) {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />
    </View>
  );
}
