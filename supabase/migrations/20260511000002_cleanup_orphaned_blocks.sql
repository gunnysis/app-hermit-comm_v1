-- user_blocks 고아 레코드 정리
-- blocked_alias가 user_preferences.display_alias에 더 이상 존재하지 않는 차단 항목 제거
-- (차단된 사용자 탈퇴 시 orphan 발생 — 무해하나 주기적 정리)

-- 1. 고아 차단 정리 함수 (관리자 전용)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_blocks()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INT;
BEGIN
  -- 관리자만 실행 가능
  IF NOT EXISTS (
    SELECT 1 FROM app_admin WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  WITH deleted AS (
    DELETE FROM user_blocks ub
    WHERE NOT EXISTS (
      SELECT 1 FROM user_preferences up
      WHERE up.display_alias = ub.blocked_alias
    )
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphaned_blocks() IS
  '관리자 전용: 탈퇴 유저의 고아 차단 항목 제거. 반환값: 삭제된 행 수.';

-- 2. 보안: 일반 사용자 직접 실행 방지 (SECURITY DEFINER 함수는 owner 권한으로 실행)
REVOKE ALL ON FUNCTION public.cleanup_orphaned_blocks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_blocks() TO authenticated;
