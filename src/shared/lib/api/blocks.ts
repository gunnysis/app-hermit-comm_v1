import { supabase } from '../supabase';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from './helpers';
import { APIError } from './error';

export async function blockUser(alias: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { p_alias: alias });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] blockUser 에러:', errorMsg, { code: error.code, details: error.details });
    throw new APIError(400, errorMsg, error.code, error);
  }
}

export async function unblockUser(alias: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { p_alias: alias });
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] unblockUser 에러:', errorMsg, { code: error.code, details: error.details });
    throw new APIError(400, errorMsg, error.code, error);
  }
}

export async function getBlockedAliases(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_blocked_aliases');
  if (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('[API] getBlockedAliases 에러:', errorMsg, { code: error.code });
    throw new APIError(500, errorMsg, error.code, error);
  }
  return (data as string[]) ?? [];
}
