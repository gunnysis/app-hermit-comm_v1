/** Supabase 에러에서 메시지 추출 (빈 message 방지, 진단 강화) */
export function extractErrorMessage(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  if (error.message) return error.message;
  if (error.code) return `code: ${error.code}`;
  if (error.details) return `details: ${error.details}`;
  if (error.hint) return `hint: ${error.hint}`;

  // 비표준 필드 검사 (PostgrestError 외 에러 객체 대응)
  const raw = error as Record<string, unknown>;
  if (raw.status || raw.statusText)
    return `http ${raw.status ?? '?'} ${raw.statusText ?? ''}`.trim();
  if (raw.name) return String(raw.name);

  const keys = Object.keys(error);
  if (keys.length === 0) return 'supabase_empty_error';

  // 전체 에러 객체 직렬화 (200자 제한)
  try {
    return `supabase_error: ${JSON.stringify(error).slice(0, 200)}`;
  } catch {
    return `supabase_error (keys: ${keys.join(',')})`;
  }
}
