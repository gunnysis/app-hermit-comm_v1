import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { api } from '@/shared/lib/api';
import { logger } from '@/shared/utils/logger';
import { useRealtimeReactions } from './useRealtimeReactions';
import type { Reaction } from '@/types';

/**
 * 게시글 반응 쿼리 + 실시간 구독 + 반응 토글 핸들러.
 * - pendingTypes: 현재 처리 중인 반응 타입 Set (반응별 연타 방지)
 * - userReactedTypes: 현재 사용자가 남긴 반응 타입 목록 (취소 표시용)
 *
 * get_post_reactions RPC는 { reaction_type, count, user_reacted }를 반환하므로
 * 별도의 getUserReactions 호출 없이 단일 쿼리로 처리.
 */
export function usePostDetailReactions(postId: number) {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());

  const { data: reactionData = [] } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: () => api.getPostReactions(postId),
    enabled: postId > 0,
  });

  // RPC 응답을 기존 Reaction[] 형태로 변환 (ReactionBar 호환)
  const reactions: Reaction[] = useMemo(
    () =>
      reactionData.map((r) => ({
        reaction_type: r.reaction_type,
        count: r.count,
      })),
    [reactionData],
  );

  // user_reacted 필드에서 사용자 반응 목록 추출
  const userReactedTypes: string[] = useMemo(
    () => reactionData.filter((r) => r.user_reacted).map((r) => r.reaction_type),
    [reactionData],
  );

  useRealtimeReactions({
    postId,
    onReactionsChange: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', postId] });
    },
  });

  const handleReaction = useCallback(
    async (reactionType: string) => {
      if (pendingRef.current.has(reactionType)) return;

      pendingRef.current.add(reactionType);
      setPendingTypes(new Set(pendingRef.current));

      try {
        await api.toggleReaction(postId, reactionType);
        await queryClient.invalidateQueries({ queryKey: ['reactions', postId] });
      } catch (err) {
        logger.error('[반응] toggleReaction 실패:', err);
        Toast.show({
          type: 'error',
          text1: '반응 등록에 실패했어요',
          text2: '잠시 후 다시 시도해 주세요.',
        });
      } finally {
        pendingRef.current.delete(reactionType);
        setPendingTypes(new Set(pendingRef.current));
      }
    },
    [postId, queryClient],
  );

  return { reactions, userReactedTypes, handleReaction, pendingTypes };
}
