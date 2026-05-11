import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import { useTrendingPosts } from '../hooks/useTrendingPosts';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import { formatDate } from '@/shared/utils/format';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import type { TrendingPost } from '@/types';

const CONTAINER_MAX_WIDTH = 672; // web:max-w-2xl (PostList.web.tsx 기준)
const CONTAINER_PADDING = 32; // px-4 양쪽 = 16 * 2

function TrendingPostCardMobile({ post, isDark }: { post: TrendingPost; isDark: boolean }) {
  const router = useRouter();
  const accentColor = post.emotions?.[0] ? EMOTION_COLOR_MAP[post.emotions[0]]?.gradient[1] : null;

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      className="w-52 mr-3 p-3 rounded-xl bg-cream-50 dark:bg-stone-800 border border-cream-200 dark:border-stone-700 active:opacity-75 cursor-pointer"
      accessibilityLabel={`트렌딩 게시글: ${post.title}`}
      accessibilityRole="button">
      {accentColor && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: accentColor,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />
      )}
      <Text
        className="text-sm font-semibold text-gray-800 dark:text-stone-100 mb-1.5 leading-5"
        numberOfLines={3}>
        {post.title}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-stone-400 mb-2" numberOfLines={1}>
        {post.display_name}
      </Text>
      {post.emotions && post.emotions.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {post.emotions.slice(0, 2).map((emotion) => (
            <View key={emotion} className="rounded-full bg-stone-100 dark:bg-stone-700 px-2 py-0.5">
              <Text className="text-[10px] text-stone-500 dark:text-stone-400">
                {EMOTION_EMOJI[emotion] ?? '💬'} {emotion}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View className="flex-row items-center gap-3">
        <Text className="text-[11px] text-gray-400 dark:text-stone-500">
          ❤️ {post.like_count ?? 0}
        </Text>
        <Text className="text-[11px] text-gray-400 dark:text-stone-500">
          💬 {post.comment_count ?? 0}
        </Text>
      </View>
    </Pressable>
  );
}

function TrendingPostsMobileWeb({ posts, isDark }: { posts: TrendingPost[]; isDark: boolean }) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-bold text-gray-700 dark:text-stone-200 mb-2">
        🔥 지금 뜨는 글
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        {posts.map((post) => (
          <TrendingPostCardMobile key={post.id} post={post} isDark={isDark} />
        ))}
      </ScrollView>
    </View>
  );
}

function TrendingPostCard({
  post,
  cardWidth,
  isDark,
}: {
  post: TrendingPost;
  cardWidth: number;
  isDark: boolean;
}) {
  const router = useRouter();
  const accentColor = post.emotions?.[0] ? EMOTION_COLOR_MAP[post.emotions[0]]?.gradient[1] : null;

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      style={{
        width: cardWidth,
        shadowColor: isDark ? '#000' : '#78716C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
      className="rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-700/60 bg-white dark:bg-stone-900 cursor-pointer active:opacity-80 mb-3"
      accessibilityLabel={`트렌딩 게시글: ${post.title}`}
      accessibilityRole="button">
      {/* 감정 색상 사이드 바 */}
      {accentColor && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: accentColor,
          }}
        />
      )}

      <View className="p-3.5 pl-4">
        {/* 제목 */}
        <Text
          className="text-sm font-bold text-gray-800 dark:text-stone-100 leading-[1.4] mb-1.5"
          numberOfLines={3}>
          {post.title}
        </Text>

        {/* 작성자 */}
        <View
          className={`self-start px-2 py-0.5 rounded-full mb-2 ${
            isDark ? 'bg-happy-900/30' : 'bg-happy-50'
          }`}>
          <Text
            className="text-[10px] font-medium text-happy-700 dark:text-happy-300"
            numberOfLines={1}>
            {post.display_name}
          </Text>
        </View>

        {/* 감정 태그 */}
        {post.emotions && post.emotions.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-2.5">
            {post.emotions.slice(0, 2).map((emotion) => {
              const colors = EMOTION_COLOR_MAP[emotion];
              return (
                <View
                  key={emotion}
                  style={
                    colors
                      ? {
                          backgroundColor: isDark ? colors.gradient[1] + '20' : colors.gradient[0],
                          borderColor: colors.gradient[1],
                          borderWidth: 1,
                        }
                      : undefined
                  }
                  className={`rounded-full px-2 py-0.5 ${
                    !colors ? (isDark ? 'bg-stone-800' : 'bg-stone-100') : ''
                  }`}>
                  <Text
                    className={`text-[10px] font-medium ${
                      !colors ? 'text-stone-500 dark:text-stone-400' : 'dark:text-stone-300'
                    }`}
                    style={colors && !isDark ? { color: '#57534E' } : undefined}>
                    {EMOTION_EMOJI[emotion] ?? '💬'} {emotion}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 하단: 반응 + 날짜 */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View
              className={`flex-row items-center px-1.5 py-0.5 rounded-full ${
                (post.like_count ?? 0) === 0
                  ? 'opacity-40'
                  : isDark
                    ? 'bg-coral-900/30'
                    : 'bg-coral-50'
              }`}>
              <Text className="text-[11px] font-medium text-coral-600 dark:text-coral-300">
                ❤️ {post.like_count ?? 0}
              </Text>
            </View>
            <View
              className={`flex-row items-center px-1.5 py-0.5 rounded-full ${
                (post.comment_count ?? 0) === 0
                  ? 'opacity-40'
                  : isDark
                    ? 'bg-stone-800'
                    : 'bg-stone-50'
              }`}>
              <Text className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                💬 {post.comment_count ?? 0}
              </Text>
            </View>
          </View>
          <Text className="text-[10px] text-stone-400 dark:text-stone-500">
            {formatDate(post.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function TrendingPosts() {
  const { data: posts = [], isLoading } = useTrendingPosts();
  const { isPhone, isDesktop, width } = useResponsiveLayout();
  const isDark = useColorScheme() === 'dark';

  if (isLoading) {
    return (
      <View className="py-3 items-center">
        <ActivityIndicator size="small" color="#FFC300" />
      </View>
    );
  }

  if (posts.length === 0) return null;

  // 모바일 웹: 앱과 동일하게 수평 스크롤
  if (isPhone) {
    return <TrendingPostsMobileWeb posts={posts} isDark={isDark} />;
  }

  // 태블릿/데스크톱: 반응형 그리드
  const numCols = isDesktop ? 3 : 2;
  const gap = 12;
  const containerWidth = Math.min(width, CONTAINER_MAX_WIDTH) - CONTAINER_PADDING;
  const cardWidth = Math.floor((containerWidth - gap * (numCols - 1)) / numCols);

  return (
    <View className="mb-4">
      <Text className="text-sm font-bold text-gray-700 dark:text-stone-200 mb-3">
        🔥 지금 뜨는 글
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {posts.map((post) => (
          <TrendingPostCard key={post.id} post={post} cardWidth={cardWidth} isDark={isDark} />
        ))}
      </View>
    </View>
  );
}
