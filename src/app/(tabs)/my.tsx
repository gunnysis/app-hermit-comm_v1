import React from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { auth } from '@/features/auth/auth';
import { confirmAlert } from '@/shared/utils/confirmAlert';
import { ScreenHeader } from '@/shared/components/composed/ScreenHeader';
import { ProfileSection } from '@/features/my/components/ProfileSection';
import { ActivitySummary } from '@/features/my/components/ActivitySummary';
import { EmotionCalendar } from '@/features/posts/components/EmotionCalendar';
import { EmotionWaveNative } from '@/features/my/components/EmotionWaveNative';
import { Loading } from '@/shared/components/primitives/Loading';
import { SectionErrorBoundary } from '@/shared/components/composed/SectionErrorBoundary';
import { useResponsiveLayout, CONTENT_MAX_WIDTH } from '@/shared/hooks/useResponsiveLayout';

export default function MyScreen() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const { isWide } = useResponsiveLayout();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className={`text-base text-center ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
          로그인이 필요해요
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#1c1917' : '#fff' }}>
      <ScreenHeader title="나" suppressOnWeb />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}>
        <View
          style={
            isWide ? { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' } : undefined
          }>
          {/* 프로필 히어로 */}
          <View className="mt-4">
            <ProfileSection user={user} />
          </View>

          {/* 활동 요약 */}
          <Text
            className={`text-xs font-semibold mb-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            활동
          </Text>
          <SectionErrorBoundary message="활동 요약을 불러올 수 없어요.">
            <ActivitySummary enabled={!!user} />
          </SectionErrorBoundary>

          <SectionErrorBoundary message="감정 캘린더를 불러올 수 없어요.">
            <EmotionCalendar userId={user.id} />
          </SectionErrorBoundary>

          <View className={`h-px my-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

          <SectionErrorBoundary message="감정 웨이브를 불러올 수 없어요.">
            <EmotionWaveNative />
          </SectionErrorBoundary>

          <View className={`h-px my-3 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />

          {/* 로그아웃: 개발 환경에서만 표시 (익명 사용자 데이터 손실 방지) */}
          {__DEV__ && (
            <View className="mt-4 mb-2">
              <Pressable
                onPress={async () => {
                  const confirmed = await confirmAlert(
                    '⚠️ 개발용 로그아웃',
                    '익명 사용자가 로그아웃하면 새로운 계정이 생성되어 기존 글을 수정/삭제할 수 없게 됩니다.\n\n이 버튼은 개발 환경에서만 표시됩니다.',
                    '로그아웃',
                  );
                  if (!confirmed) return;
                  try {
                    await auth.signOut();
                    await auth.signInAnonymously();
                  } catch {
                    Toast.show({ type: 'error', text1: '로그아웃에 실패했어요' });
                  }
                }}
                className={`rounded-lg px-4 py-3 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                <Text
                  className={`text-sm text-center ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  🔧 로그아웃 (개발용)
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
