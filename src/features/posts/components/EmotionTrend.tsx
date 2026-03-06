import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useEmotionTrend } from '../hooks/useEmotionTrend';
import { EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface EmotionTrendProps {
  days?: number;
  className?: string;
  selectedEmotion?: string | null;
  onEmotionSelect?: (emotion: string | null) => void;
}

export function EmotionTrend({
  days = 7,
  className = '',
  selectedEmotion,
  onEmotionSelect,
}: EmotionTrendProps) {
  const { data: trend = [], isLoading } = useEmotionTrend(days);
  const top3 = trend.slice(0, 3);

  if (isLoading || top3.length === 0) {
    return null;
  }

  return (
    <View
      className={`rounded-xl border border-cream-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 mb-2 ${className}`.trim()}
      accessibilityLabel={`요즘 마을 분위기: ${top3.map((t) => t.emotion).join(', ')}`}>
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-xs text-gray-500 dark:text-stone-400">요즘 마을 분위기</Text>
        {selectedEmotion && (
          <Pressable
            onPress={() => onEmotionSelect?.(null)}
            className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 active:opacity-70"
            accessibilityLabel="감정 필터 초기화">
            <Text className="text-xs text-stone-500 dark:text-stone-400">초기화</Text>
          </Pressable>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {top3.map(({ emotion, cnt, pct }) => {
          const emoji = EMOTION_EMOJI[emotion] ?? '';
          const isActive = selectedEmotion === emotion;
          const colors = EMOTION_COLOR_MAP[emotion];
          const gradientBg = colors?.gradient[0];

          return (
            <Pressable
              key={emotion}
              onPress={() => onEmotionSelect?.(isActive ? null : emotion)}
              style={isActive && gradientBg ? { backgroundColor: gradientBg } : undefined}
              className={`rounded-full px-3 py-1.5 active:opacity-70 ${
                isActive
                  ? 'border border-stone-300 dark:border-stone-500'
                  : 'bg-stone-100 dark:bg-stone-800'
              }`}
              accessibilityLabel={`${emotion} ${pct}% ${isActive ? '(선택됨)' : ''}`}>
              <Text
                className={`text-sm ${
                  isActive
                    ? 'font-semibold text-stone-800 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-300'
                }`}>
                {emoji} {emotion} {pct != null ? `${pct}%` : cnt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
