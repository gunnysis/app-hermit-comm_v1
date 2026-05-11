import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { logger } from '@/shared/utils/logger';

interface Props {
  children: ReactNode;
  /** 에러 시 표시할 한 줄 메시지 */
  message?: string;
  /** 재시도 버튼 레이블 */
  retryLabel?: string;
}

interface State {
  hasError: boolean;
}

/**
 * 섹션 단위 에러 격리 경계.
 * AppErrorBoundary가 앱 전체를 잡는 것과 달리, 특정 섹션만 에러 UI로 대체한다.
 * 함수형 컴포넌트 래퍼(SectionErrorBoundaryView)를 통해 colorScheme을 주입한다.
 */
class SectionErrorBoundaryClass extends Component<Props & { isDark: boolean }, State> {
  constructor(props: Props & { isDark: boolean }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[SectionErrorBoundary]', error, errorInfo);
    if (!__DEV__) {
      try {
        const Sentry = require('@sentry/react-native');
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      } catch {
        // Sentry 미설정 시 무시
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    const {
      children,
      message = '이 섹션을 불러올 수 없어요.',
      retryLabel = '다시 시도',
      isDark,
    } = this.props;

    if (this.state.hasError) {
      return (
        <View
          className={`rounded-xl p-4 items-center ${isDark ? 'bg-stone-800' : 'bg-stone-50'}`}
          style={{ borderWidth: 1, borderColor: isDark ? '#44403c' : '#e7e5e4' }}>
          <Text
            className={`text-sm text-center mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {message}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}>
            <Text className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {retryLabel}
            </Text>
          </Pressable>
        </View>
      );
    }

    return children;
  }
}

export function SectionErrorBoundary({ children, message, retryLabel }: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <SectionErrorBoundaryClass isDark={isDark} message={message} retryLabel={retryLabel}>
      {children}
    </SectionErrorBoundaryClass>
  );
}
