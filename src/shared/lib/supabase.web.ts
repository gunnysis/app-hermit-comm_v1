import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { Database } from '@/types/database.gen';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 설정되지 않았습니다. ' +
      '.env 파일을 확인하거나 app.config.js에서 설정하세요.',
  );
}

/**
 * 웹 전용 Supabase 클라이언트.
 * AsyncStorage 대신 localStorage를 사용해 Node.js SSR 환경에서 window 오류 방지.
 * detectSessionInUrl: true — OAuth 리다이렉트 처리.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // 기본값: localStorage (브라우저 표준)
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
