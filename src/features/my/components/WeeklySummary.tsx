import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useWeeklySummary } from '../hooks/useWeeklySummary';
import { EMOTION_EMOJI, ACTIVITY_PRESETS } from '@/shared/lib/constants';

interface WeeklySummaryProps {
  enabled?: boolean;
}

export function WeeklySummary({ enabled = true }: WeeklySummaryProps) {
  const isDark = useColorScheme() === 'dark';
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, isLoading } = useWeeklySummary(weekOffset, enabled);

  if (isLoading || !data) return null;
  if (!data.days_logged || data.days_logged === 0) return null;

  const getActivityLabel = (id: string) => {
    const preset = ACTIVITY_PRESETS.find((p) => p.id === id);
    return preset ? `${preset.icon} ${preset.name}` : id;
  };

  const weekLabel =
    weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '지난주' : `${weekOffset}주 전`;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={`mx-4 mt-4 rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? 'rgba(68,64,60,0.4)' : '#E8DCC8',
      }}>
      {/* 헤더 + 네비게이션 */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-sm font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
          📅 {weekLabel} 감정 회고
        </Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setWeekOffset(weekOffset + 1)} className="px-2 py-1">
            <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>◀</Text>
          </Pressable>
          {weekOffset > 0 && (
            <Pressable onPress={() => setWeekOffset(weekOffset - 1)} className="px-2 py-1">
              <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>▶</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 기록일 */}
      <Text className={`text-xs mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
        7일 중 {data.days_logged}일 기록
      </Text>

      {/* Top 감정 */}
      {data.top_emotions && data.top_emotions.length > 0 && (
        <View className="mb-3">
          <Text className={`text-xs mb-1.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            많이 느낀 감정
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {data.top_emotions.slice(0, 5).map((item) => (
              <View
                key={item.emotion}
                className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-stone-700' : 'bg-stone-100'}`}>
                <Text className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  {EMOTION_EMOJI[item.emotion] ?? '💭'} {item.emotion}
                  <Text className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                    {' '}
                    {item.count}회
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top 활동 */}
      {data.top_activity && (
        <Text className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          가장 많이 한 활동: {getActivityLabel(data.top_activity)}
        </Text>
      )}
    </Animated.View>
  );
}
