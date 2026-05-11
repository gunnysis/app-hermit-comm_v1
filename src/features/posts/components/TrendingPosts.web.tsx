import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { pushPost } from '@/shared/lib/navigation';
import { useTrendingPosts } from '../hooks/useTrendingPosts';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';
import { useResponsiveLayout, CONTENT_MAX_WIDTH } from '@/shared/hooks/useResponsiveLayout';
import type { TrendingPost } from '@/types';

/** Container 내부 기준: px-4 좌우 패딩 = 16*2 */
const INNER_PADDING = 32;
const GRID_GAP = 12;

function TrendingPostCard({
  post,
  width,
  isDark,
}: {
  post: TrendingPost;
  width: number;
  isDark: boolean;
}) {
  const router = useRouter();
  const accentColor = post.emotions?.[0] ? EMOTION_COLOR_MAP[post.emotions[0]]?.gradient[1] : null;

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      style={{
        width,
        shadowColor: isDark ? '#000' : '#78716C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
      className="rounded-xl overflow-hidden border border-cream-200/80 dark:border-stone-700/60 bg-white dark:bg-stone-900 cursor-pointer active:opacity-80 mb-3"
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
          }}
        />
      )}
      <View className="p-3 pl-4">
        <Text
          className="text-sm font-semibold text-gray-800 dark:text-stone-100 leading-5 mb-1.5"
          numberOfLines={3}>
          {post.title}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-stone-400 mb-2" numberOfLines={1}>
          {post.display_name}
        </Text>
        {post.emotions && post.emotions.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-2">
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
                    !colors ? (isDark ? 'bg-stone-700' : 'bg-stone-100') : ''
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
        <View className="flex-row items-center gap-3">
          <Text className="text-[11px] text-gray-400 dark:text-stone-500">
            ❤️ {post.like_count ?? 0}
          </Text>
          <Text className="text-[11px] text-gray-400 dark:text-stone-500">
            💬 {post.comment_count ?? 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function TrendingPostCardMobile({ post, isDark }: { post: TrendingPost; isDark: boolean }) {
  const router = useRouter();
  const accentColor = post.emotions?.[0] ? EMOTION_COLOR_MAP[post.emotions[0]]?.gradient[1] : null;

  return (
    <Pressable
      onPress={() => pushPost(router, post.id)}
      className="w-52 mr-3 p-3 rounded-xl bg-cream-50 dark:bg-stone-800 border border-cream-200 dark:border-stone-700 active:opacity-80 cursor-pointer"
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
        className="text-sm font-semibold text-gray-800 dark:text-stone-100 mb-1 leading-5"
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

  // 모바일 웹: 앱과 동일한 수평 스크롤
  if (isPhone) {
    return (
      <View className="mb-2">
        <Text className="text-sm font-bold text-gray-700 dark:text-stone-200 mb-2 px-1">
          지금 뜨는 글
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

  // 태블릿/데스크톱: 반응형 그리드
  const numCols = isDesktop ? 3 : 2;
  const containerWidth = Math.min(width, CONTENT_MAX_WIDTH) - INNER_PADDING;
  const cardWidth = Math.floor((containerWidth - GRID_GAP * (numCols - 1)) / numCols);

  return (
    <View className="mb-2">
      <Text className="text-sm font-bold text-gray-700 dark:text-stone-200 mb-2 px-1">
        지금 뜨는 글
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
        {posts.map((post) => (
          <TrendingPostCard key={post.id} post={post} width={cardWidth} isDark={isDark} />
        ))}
      </View>
    </View>
  );
}
