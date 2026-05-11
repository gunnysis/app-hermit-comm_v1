import type { Router } from 'expo-router';

/**
 * 뒤로 가기 — 히스토리가 없으면 홈으로 대체.
 *
 * 웹에서 직접 URL로 접근하거나 새 탭으로 열면 브라우저 히스토리가 없어
 * router.back() = window.history.back()이 no-op이 됨.
 * canGoBack()으로 히스토리 여부를 체크하고 없으면 홈('/')으로 이동.
 */
export function goBack(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
