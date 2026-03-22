import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from './helpers';
import { APIError } from './error';

export interface Notification {
  id: number;
  type: 'reaction' | 'comment' | 'reply';
  post_id: number | null;
  comment_id: number | null;
  actor_alias: string | null;
  read: boolean;
  created_at: string;
}

export async function getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
  const { data, error } = await supabase.rpc('get_notifications', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getNotifications 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getUnreadCount 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
  return (data as number) ?? 0;
}

export async function markRead(ids: number[]): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read', { p_ids: ids });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] markRead 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
}

export async function markAllRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] markAllRead 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code);
  }
}
