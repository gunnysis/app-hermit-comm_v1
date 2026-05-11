import { Alert, Platform } from 'react-native';

/**
 * 확인/취소 다이얼로그 (크로스플랫폼).
 *
 * react-native-web 0.21+ 에서 Alert.alert()는 no-op이므로
 * 웹에서는 window.confirm()을 직접 사용.
 *
 * @returns 사용자가 확인하면 true, 취소하면 false
 */
export function confirmAlert(
  title: string,
  message: string,
  confirmText = '확인',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = [title, message].filter(Boolean).join('\n\n');
    return Promise.resolve(window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
