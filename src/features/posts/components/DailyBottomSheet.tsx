import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps, BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import {
  ALLOWED_EMOTIONS,
  EMOTION_EMOJI,
  EMOTION_COLOR_MAP,
  DAILY_CONFIG,
  SHARED_PALETTE,
} from '@/shared/lib/constants';
import { ActivityTagSelector } from '@/shared/components/composed/ActivityTagSelector';
import { useTabBarHeight } from '@/shared/hooks/useTabBarHeight';
import { useCreateDaily } from '@/features/my/hooks/useCreateDaily';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
interface DailyBottomSheetProps {
  onDismiss?: () => void;
}

/** Glassmorphism 배경 — 탭바와 동일한 블러 디자인 언어 */
function GlassBackground({ style }: BottomSheetBackgroundProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Animated.View style={[style, styles.glassBg]}>
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(28, 25, 23, 0.75)' : 'rgba(255, 255, 255, 0.80)',
            borderTopWidth: 1,
            borderColor: isDark ? 'rgba(120, 113, 108, 0.2)' : 'rgba(255, 255, 255, 0.4)',
          },
        ]}
      />
    </Animated.View>
  );
}

/** 오늘 날짜 포맷 (M월 d일 요일, KST) */
function todayLabel(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${m}월 ${d}일 ${dayNames[kst.getUTCDay()]}`;
}

export const DailyBottomSheet = forwardRef<BottomSheet, DailyBottomSheetProps>(
  function DailyBottomSheet({ onDismiss }, ref) {
    const isDark = useColorScheme() === 'dark';
    const tabBarHeight = useTabBarHeight();
    const snapPoints = useMemo(() => ['45%', '75%', '92%'], []);
    const [emotions, setEmotions] = useState<string[]>([]);
    const [activities, setActivities] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [currentIndex, setCurrentIndex] = useState(-1);
    const queryClient = useQueryClient();
    const { mutate: createDaily, isPending } = useCreateDaily();

    const resetState = useCallback(() => {
      setEmotions([]);
      setActivities([]);
      setNote('');
    }, []);

    const toggleEmotion = useCallback(
      (emotion: string) => {
        if (emotions.includes(emotion)) {
          Haptics.selectionAsync();
          setEmotions(emotions.filter((e) => e !== emotion));
        } else if (emotions.length < DAILY_CONFIG.MAX_EMOTIONS) {
          Haptics.selectionAsync();
          setEmotions([...emotions, emotion]);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Toast.show({
            type: 'info',
            text1: `감정은 최대 ${DAILY_CONFIG.MAX_EMOTIONS}개까지 선택할 수 있어요`,
          });
        }
      },
      [emotions],
    );

    const handleSubmit = useCallback(() => {
      if (emotions.length === 0 || isPending) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      createDaily(
        { emotions, activities, content: note },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: '오늘의 하루를 나눴어요' });
            resetState();
            (ref as React.RefObject<BottomSheet>)?.current?.close();
          },
          onError: (err: unknown) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const code = (err as { code?: string })?.code;
            if (code === 'P0002') {
              Toast.show({ type: 'error', text1: '오늘은 이미 나눴어요' });
            } else {
              Toast.show({ type: 'error', text1: '잠시 후 다시 시도해주세요' });
            }
          },
        },
      );
    }, [emotions, activities, note, isPending, createDaily, resetState, ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleChange = useCallback(
      (index: number) => {
        // 스냅 포인트 도달 시 햅틱 피드백
        if (index >= 0) {
          Haptics.impactAsync(
            index === 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
          );
        }
        setCurrentIndex(index);
        if (index === -1) resetState();
      },
      [resetState],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        bottomInset={tabBarHeight}
        detached={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundComponent={GlassBackground}
        onChange={handleChange}
        onClose={onDismiss}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.backgroundShadow}>
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* 헤더 */}
          <View className="items-center mb-5 pt-2">
            <Text className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              오늘의 하루
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {todayLabel()}
            </Text>
          </View>

          {/* Step 1: 감정 (항상 보임) */}
          <Text
            className={`text-sm font-medium mb-2 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
            오늘 기분이 어때요?
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ALLOWED_EMOTIONS.map((emotion) => {
              const isActive = emotions.includes(emotion);
              const colors = EMOTION_COLOR_MAP[emotion];
              return (
                <Pressable
                  key={emotion}
                  onPress={() => toggleEmotion(emotion)}
                  style={[
                    isActive ? { backgroundColor: colors?.gradient[0] } : undefined,
                    isActive ? { transform: [{ scale: 1.05 }] } : undefined,
                  ]}
                  className={`rounded-full px-3 py-1.5 ${
                    isActive ? '' : isDark ? 'bg-stone-800' : 'bg-stone-100'
                  }`}
                  accessibilityLabel={`감정 선택: ${emotion}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isActive }}>
                  <Text
                    className={`text-xs ${isActive ? 'font-semibold' : ''}`}
                    style={
                      isActive
                        ? { color: isDark ? '#fff' : '#1c1917' }
                        : { color: isDark ? '#a8a29e' : '#57534e' }
                    }>
                    {EMOTION_EMOJI[emotion]} {emotion}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Step 2: 활동 (75%+에서 보임) */}
          {currentIndex >= 1 && (
            <Animated.View
              entering={FadeInDown.delay(50).duration(250).springify()}
              className="mb-4">
              <ActivityTagSelector selected={activities} onSelect={setActivities} />
            </Animated.View>
          )}

          {/* Step 3: 한마디 + 제출 (92%에서 보임) */}
          {currentIndex >= 2 && (
            <Animated.View entering={FadeInDown.delay(100).duration(250).springify()}>
              <Text className={`text-sm mb-2 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                한마디 <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>(선택)</Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                maxLength={DAILY_CONFIG.MAX_NOTE_LENGTH}
                placeholder="오늘 하루는..."
                placeholderTextColor={isDark ? '#78716c' : '#a8a29e'}
                returnKeyType="done"
                blurOnSubmit
                className={`rounded-xl px-4 py-3 text-sm mb-1 ${
                  isDark
                    ? 'bg-stone-800 text-stone-100 border-stone-700'
                    : 'bg-stone-50 text-stone-900 border-stone-200'
                } border`}
              />
              <Text
                className={`text-right text-[10px] mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {note.length}/{DAILY_CONFIG.MAX_NOTE_LENGTH}
              </Text>
            </Animated.View>
          )}

          {/* 나누기 버튼 (감정 1개 이상 선택 시) */}
          {emotions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(50).duration(200).springify()}>
              <Pressable
                onPress={handleSubmit}
                disabled={isPending}
                className="rounded-xl py-3.5 items-center"
                style={{
                  backgroundColor: SHARED_PALETTE.happy[500],
                  opacity: isPending ? 0.6 : 1,
                }}>
                <Text className="font-semibold" style={{ color: '#1c1917' }}>
                  {isPending ? '나누는 중...' : '나누기'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  glassBg: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  handleIndicator: {
    backgroundColor: '#78716c', // stone-500
    width: 40,
    height: 5,
  },
  backgroundShadow: {
    borderRadius: 24,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    // Android elevation
    elevation: 24,
  },
});
