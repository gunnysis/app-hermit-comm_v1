import React from 'react';
import { ScrollView, Text, Pressable, useColorScheme } from 'react-native';
import { ALLOWED_EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR_MAP } from '@/shared/lib/constants';

interface EmotionFilterBarProps {
  selected: string | null;
  onSelect: (emotion: string | null) => void;
}

export function EmotionFilterBar({ selected, onSelect }: EmotionFilterBarProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-3"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      <Pressable
        onPress={() => onSelect(null)}
        style={
          selected === null
            ? {
                backgroundColor: isDark ? '#F5F5F4' : '#292524',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 2,
              }
            : {
                backgroundColor: isDark ? '#292524' : '#F5F5F4',
                borderColor: isDark ? '#44403C' : '#E7E5E4',
                borderWidth: 1.5,
              }
        }
        className="px-3.5 py-2 rounded-full">
        <Text
          className={`text-xs font-semibold ${
            selected === null
              ? isDark
                ? 'text-stone-800'
                : 'text-white'
              : isDark
                ? 'text-stone-400'
                : 'text-stone-600'
          }`}>
          전체
        </Text>
      </Pressable>
      {ALLOWED_EMOTIONS.map((emotion) => {
        const isActive = selected === emotion;
        const colors = EMOTION_COLOR_MAP[emotion];
        return (
          <Pressable
            key={emotion}
            onPress={() => onSelect(isActive ? null : emotion)}
            style={
              isActive && colors
                ? {
                    backgroundColor: colors.gradient[0],
                    borderColor: colors.gradient[1],
                    borderWidth: 1.5,
                    shadowColor: colors.gradient[1],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                : {
                    backgroundColor: isDark ? '#292524' : '#F5F5F4',
                    borderColor: isDark ? '#44403C' : '#E7E5E4',
                    borderWidth: 1.5,
                  }
            }
            className="px-3.5 py-2 rounded-full">
            <Text
              style={isActive && colors ? { color: '#44403C' } : undefined}
              className={`text-xs font-medium ${
                isActive ? '' : isDark ? 'text-stone-300' : 'text-stone-700'
              }`}>
              {EMOTION_EMOJI[emotion]} {emotion}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
