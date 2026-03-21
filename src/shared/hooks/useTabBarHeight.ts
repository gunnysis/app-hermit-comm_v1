import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 탭바 높이를 반환합니다.
 * (tabs)/_layout.tsx의 tabBarHeight 계산과 동일한 로직.
 * 탭 화면 내 absolute/overlay 요소(FAB, BottomSheet 등)의 배치에 사용하세요.
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? 88 : 60 + insets.bottom;
}
