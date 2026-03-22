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

  const keys = Object.keys(error);
  if (keys.length === 0) return 'supabase_empty_error (no fields)';
  return `supabase_error (keys: ${keys.join(',')}) ${JSON.stringify(error)}`;
}
