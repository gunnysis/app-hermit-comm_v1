import { useEffect, useState } from 'react';

/** 브라우저 navigator.onLine 기반 네트워크 상태 (웹 전용) */
export function useNetworkStatus(): { isConnected: boolean | null } {
  const [isConnected, setIsConnected] = useState<boolean | null>(
    typeof navigator !== 'undefined' ? navigator.onLine : null,
  );

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConnected };
}
