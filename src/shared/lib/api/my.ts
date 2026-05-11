import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from './helpers';
import { APIError } from './error';
import type { EmotionTimelineEntry, ActivitySummary, EmotionCalendarDay } from '@/types';

export type { ActivitySummary };

export async function getActivitySummary(): Promise<ActivitySummary> {
  const { data, error } = await supabase.rpc('get_my_activity_summary');
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getActivitySummary 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return data as unknown as ActivitySummary;
}

export async function getEmotionTimeline(days = 7): Promise<EmotionTimelineEntry[]> {
  const { data, error } = await supabase.rpc('get_emotion_timeline', { p_days: days });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getEmotionTimeline 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return (data ?? []) as EmotionTimelineEntry[];
}

export async function getUserEmotionCalendar(
  userId: string,
  days = 30,
): Promise<EmotionCalendarDay[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const { data, error } = await supabase.rpc('get_user_emotion_calendar', {
    p_user_id: userId,
    p_start: start.toISOString().slice(0, 10),
    p_end: new Date().toISOString().slice(0, 10),
  });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getUserEmotionCalendar 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return (data ?? []) as EmotionCalendarDay[];
}

export async function getMyAlias(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_alias');
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getMyAlias 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return data as string | null;
}
