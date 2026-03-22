/**
 * Daily API + error 관련 테스트
 * supabase를 mock하여 API 레이어 로직만 검증
 */

const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/shared/utils/logger', () => ({
  logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import {
  getDailyHistory,
  getMonthlyEmotionReport,
  getMyStreak,
  getWeeklyEmotionSummary,
  getYesterdayDailyReactions,
} from '@/shared/lib/api/my';

describe('Daily API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyHistory', () => {
    it('성공 시 배열 반환', async () => {
      mockRpc.mockResolvedValue({
        data: [{ id: 1, emotions: ['기쁨'], content: 'test', like_count: 0, comment_count: 0 }],
        error: null,
      });
      const result = await getDailyHistory(20, 0);
      expect(result).toHaveLength(1);
      expect(result[0].emotions).toEqual(['기쁨']);
      expect(mockRpc).toHaveBeenCalledWith('get_my_daily_history', { p_limit: 20, p_offset: 0 });
    });

    it('에러 시 throw', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error', code: '500' } });
      await expect(getDailyHistory()).rejects.toThrow('DB error');
    });

    it('data null이면 빈 배열', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      const result = await getDailyHistory();
      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyEmotionReport', () => {
    it('년/월 파라미터 전달', async () => {
      mockRpc.mockResolvedValue({
        data: { year: 2026, month: 3, days_logged: 15, top_emotions: [], top_activities: [] },
        error: null,
      });
      const result = await getMonthlyEmotionReport(2026, 3);
      expect(result.days_logged).toBe(15);
      expect(mockRpc).toHaveBeenCalledWith('get_monthly_emotion_report', {
        p_year: 2026,
        p_month: 3,
      });
    });

    it('에러 시 throw', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });
      await expect(getMonthlyEmotionReport(2026, 3)).rejects.toBeDefined();
    });
  });

  describe('getMyStreak', () => {
    it('스트릭 데이터 반환', async () => {
      mockRpc.mockResolvedValue({
        data: {
          current_streak: 5,
          total_days: 20,
          longest_streak: 10,
          completed_today: true,
          new_milestone: 0,
        },
        error: null,
      });
      const result = await getMyStreak();
      expect(result.current_streak).toBe(5);
      expect(result.completed_today).toBe(true);
    });
  });

  describe('getWeeklyEmotionSummary', () => {
    it('기본 weekOffset=0', async () => {
      mockRpc.mockResolvedValue({
        data: {
          week_start: '2026-03-16',
          week_end: '2026-03-22',
          days_logged: 5,
          top_emotions: null,
          top_activity: null,
        },
        error: null,
      });
      const result = await getWeeklyEmotionSummary(0);
      expect(result?.days_logged).toBe(5);
      expect(mockRpc).toHaveBeenCalledWith('get_weekly_emotion_summary', { p_week_offset: 0 });
    });
  });

  describe('getYesterdayDailyReactions', () => {
    it('반응 있으면 데이터 반환', async () => {
      mockRpc.mockResolvedValue({
        data: { post_id: 42, like_count: 3, comment_count: 1 },
        error: null,
      });
      const result = await getYesterdayDailyReactions();
      expect(result?.post_id).toBe(42);
      expect(result?.like_count).toBe(3);
    });

    it('data null이면 null 반환', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      const result = await getYesterdayDailyReactions();
      expect(result).toBeNull();
    });

    it('post_id 없으면 null 반환', async () => {
      mockRpc.mockResolvedValue({ data: {}, error: null });
      const result = await getYesterdayDailyReactions();
      expect(result).toBeNull();
    });
  });
});
