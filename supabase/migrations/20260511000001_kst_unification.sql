-- 타임존 로직 통합: kst_date() 헬퍼로 일원화
-- get_emotion_timeline, get_my_activity_summary 의 inline AT TIME ZONE → kst_date() 사용
-- kst_date()는 20260329000001_daily_evolution.sql 에서 이미 정의됨

-- 1. get_emotion_timeline: kst_date() 활용
CREATE OR REPLACE FUNCTION public.get_emotion_timeline(p_days INT DEFAULT 7)
RETURNS TABLE(day DATE, emotion TEXT, cnt BIGINT)
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT kst_date(pa.analyzed_at),
         unnest(pa.emotions),
         COUNT(*)::BIGINT
  FROM post_analysis pa
  WHERE kst_date(pa.analyzed_at) >= kst_date(now()) - p_days
  GROUP BY 1, 2
  ORDER BY 1, 3 DESC;
END;
$$;

-- 2. get_my_activity_summary: kst_date() 활용
CREATE OR REPLACE FUNCTION public.get_my_activity_summary()
RETURNS JSON
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_post_count INT;
  v_comment_count INT;
  v_reaction_count INT;
  v_streak INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_post_count
  FROM posts WHERE author_id = v_uid AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO v_comment_count
  FROM comments WHERE author_id = v_uid AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO v_reaction_count
  FROM user_reactions WHERE user_id = v_uid;

  -- 연속 글쓰기 일수 (스트릭) — kst_date() 사용
  WITH daily AS (
    SELECT DISTINCT kst_date(created_at) AS d
    FROM posts
    WHERE author_id = v_uid AND deleted_at IS NULL
    ORDER BY d DESC
  ),
  numbered AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::INT * INTERVAL '1 day' AS grp
    FROM daily
  )
  SELECT COUNT(*)::INT INTO v_streak
  FROM numbered
  WHERE grp = (SELECT grp FROM numbered LIMIT 1);

  RETURN json_build_object(
    'post_count', v_post_count,
    'comment_count', v_comment_count,
    'reaction_count', v_reaction_count,
    'streak', COALESCE(v_streak, 0)
  );
END;
$$;

COMMENT ON FUNCTION public.get_emotion_timeline(INT) IS
  '감정 분포 타임라인 (p_days일, KST 기준, kst_date() 사용)';

COMMENT ON FUNCTION public.get_my_activity_summary() IS
  '내 활동 요약 — 글/댓글/반응/스트릭 (KST 기준, kst_date() 사용)';
