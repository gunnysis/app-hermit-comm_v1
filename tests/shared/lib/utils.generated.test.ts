import { getCurrentKST, getActivityLabel, processEmotionTimeline } from '@/shared/lib/utils.generated';
import { validateDailyPostInput } from '@/shared/lib/utils.generated';

describe('getCurrentKST', () => {
  it('year, month, date를 반환한다', () => {
    const result = getCurrentKST();
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('date');
    expect(result.year).toBeGreaterThanOrEqual(2026);
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
    expect(result.date).toBeGreaterThanOrEqual(1);
    expect(result.date).toBeLessThanOrEqual(31);
  });
});

describe('getActivityLabel', () => {
  const presets = [
    { id: 'rest', name: '휴식', icon: '😴' },
    { id: 'exercise', name: '운동', icon: '💪' },
  ];

  it('프리셋에 있는 활동은 아이콘+이름 반환', () => {
    expect(getActivityLabel('rest', presets)).toBe('😴 휴식');
    expect(getActivityLabel('exercise', presets)).toBe('💪 운동');
  });

  it('프리셋에 없는 활동은 id 그대로 반환', () => {
    expect(getActivityLabel('custom_thing', presets)).toBe('custom_thing');
  });
});

describe('validateDailyPostInput', () => {
  it('감정 0개면 에러', () => {
    expect(validateDailyPostInput({ emotions: [] })).toBe('감정을 하나 이상 선택해주세요.');
  });

  it('감정 1~3개면 통과', () => {
    expect(validateDailyPostInput({ emotions: ['슬픔'] })).toBeNull();
    expect(validateDailyPostInput({ emotions: ['슬픔', '외로움', '불안'] })).toBeNull();
  });

  it('감정 4개 이상이면 에러', () => {
    expect(validateDailyPostInput({ emotions: ['a', 'b', 'c', 'd'] })).toBe('감정은 최대 3개까지 선택할 수 있어요.');
  });

  it('활동 6개 이상이면 에러', () => {
    const result = validateDailyPostInput({
      emotions: ['슬픔'],
      activities: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(result).toBe('활동은 최대 5개까지 선택할 수 있어요.');
  });

  it('내용 201자 이상이면 에러', () => {
    const result = validateDailyPostInput({
      emotions: ['슬픔'],
      content: 'a'.repeat(201),
    });
    expect(result).toBe('한마디는 200자 이내로 입력해주세요.');
  });

  it('활동/내용 없이 감정만으로 통과', () => {
    expect(validateDailyPostInput({ emotions: ['기쁨'] })).toBeNull();
  });

  it('모든 필드 정상이면 통과', () => {
    expect(validateDailyPostInput({
      emotions: ['기쁨', '설렘'],
      activities: ['rest', 'exercise'],
      content: '좋은 하루',
    })).toBeNull();
  });
});

describe('processEmotionTimeline', () => {
  it('빈 배열이면 빈 결과 반환', () => {
    const result = processEmotionTimeline([]);
    expect(result.bars).toEqual([]);
    expect(result.topEmotions).toEqual([]);
    expect(result.maxTotal).toBeGreaterThanOrEqual(0);
  });

  it('타임라인 데이터를 바 차트로 변환', () => {
    const timeline = [
      { date: '2026-03-20', emotion: '기쁨', count: 5 },
      { date: '2026-03-20', emotion: '슬픔', count: 3 },
      { date: '2026-03-21', emotion: '기쁨', count: 2 },
    ];
    const result = processEmotionTimeline(timeline);
    expect(result.bars.length).toBeGreaterThanOrEqual(1);
    expect(result.topEmotions).toContain('기쁨');
    expect(result.maxTotal).toBeGreaterThan(0);
  });
});
