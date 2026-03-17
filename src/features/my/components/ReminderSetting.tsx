import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, useColorScheme, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'daily_reminder_settings';
const REMINDER_ID = 'daily-checkin-reminder';

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 21, // 오후 9시 기본
  minute: 0,
};

const TIME_OPTIONS = [
  { label: '아침 9시', hour: 9, minute: 0 },
  { label: '점심 12시', hour: 12, minute: 0 },
  { label: '저녁 6시', hour: 18, minute: 0 },
  { label: '밤 9시', hour: 21, minute: 0 },
];

export function ReminderSetting() {
  const isDark = useColorScheme() === 'dark';
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));

      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const scheduleReminder = async (hour: number, minute: number) => {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: '오늘 하루는 어땠나요?',
        body: '잠깐 멈추고 오늘의 감정을 기록해보세요',
        sound: true,
        data: { screen: 'DailyCheckIn' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  };

  const cancelReminder = async () => {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  };

  const toggleEnabled = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!settings.enabled) {
      const granted = hasPermission || (await requestPermission());
      if (!granted) return;

      await scheduleReminder(settings.hour, settings.minute);
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } else {
      await cancelReminder();
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  };

  const selectTime = async (hour: number, minute: number) => {
    Haptics.selectionAsync();
    const newSettings = { ...settings, hour, minute };
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

    if (settings.enabled) {
      await scheduleReminder(hour, minute);
    }
  };

  if (Platform.OS === 'web') return null;

  return (
    <View className={`rounded-2xl p-4 ${isDark ? 'bg-stone-800/50' : 'bg-cream-50'}`}>
      {/* 알림 토글 */}
      <Pressable
        onPress={toggleEnabled}
        className="flex-row justify-between items-center"
        accessibilityRole="switch"
        accessibilityState={{ checked: settings.enabled }}
        accessibilityLabel="매일 기록 알림">
        <View>
          <Text className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            🔔 매일 기록 알림
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {settings.enabled ? `매일 ${settings.hour}시에 알림` : '알림을 켜면 기록을 잊지 않아요'}
          </Text>
        </View>
        <View
          className={`w-12 h-7 rounded-full justify-center ${
            settings.enabled
              ? 'bg-happy-500 items-end'
              : isDark
                ? 'bg-stone-600 items-start'
                : 'bg-stone-300 items-start'
          }`}>
          <View className="w-5 h-5 rounded-full bg-white mx-1 shadow-sm" />
        </View>
      </Pressable>

      {/* 시간 선택 (알림 켜진 경우만) */}
      {settings.enabled && (
        <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          {TIME_OPTIONS.map((opt) => {
            const isActive = settings.hour === opt.hour && settings.minute === opt.minute;
            return (
              <Pressable
                key={opt.label}
                onPress={() => selectTime(opt.hour, opt.minute)}
                className={`rounded-full px-3 py-1.5 ${
                  isActive ? 'bg-happy-500' : isDark ? 'bg-stone-700' : 'bg-stone-100'
                }`}>
                <Text
                  className={`text-xs ${
                    isActive
                      ? 'font-semibold text-stone-900'
                      : isDark
                        ? 'text-stone-300'
                        : 'text-stone-600'
                  }`}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {hasPermission === false && (
        <Text className="text-xs text-coral-500 mt-2">
          알림 권한이 필요해요. 설정에서 허용해주세요.
        </Text>
      )}
    </View>
  );
}
