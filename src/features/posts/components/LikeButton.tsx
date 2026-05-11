import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { haptics } from '@/shared/utils/haptics';

interface LikeButtonProps {
  count: number;
  onPress: () => void;
  loading?: boolean;
}

export function LikeButton({ count, onPress, loading = false }: LikeButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    if (loading) return;

    setPressed(true);

    // 햅틱 피드백
    haptics.medium();

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`
        flex-row items-center px-5 py-2.5 rounded-full border-2
        ${
          pressed
            ? 'bg-coral-50 dark:bg-coral-900/30 border-coral-400 shadow-lg'
            : 'bg-white dark:bg-stone-800 border-cream-300 dark:border-stone-600 shadow-md'
        }
        active:scale-95
      `}>
      <Text className="text-2xl mr-2">{pressed ? '❤️' : '🤍'}</Text>
      <Text
        className={`text-base font-bold ${pressed ? 'text-coral-600 dark:text-coral-400' : 'text-gray-700 dark:text-stone-200'}`}>
        {count}
      </Text>
    </Pressable>
  );
}
