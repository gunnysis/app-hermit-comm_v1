import { z } from 'zod';
import { VALIDATION } from './constants';

/** HTML 태그 제거 후 실제 텍스트 추출 */
function stripHtmlForValidation(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, '')
    .trim();
}

/** 글 작성/수정 검증 */
export const postSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(VALIDATION.POST_TITLE_MAX, `제목은 ${VALIDATION.POST_TITLE_MAX}자 이내로 입력해주세요.`)
    .refine((val) => val.trim().length > 0, '제목을 입력해주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .max(
      VALIDATION.POST_CONTENT_MAX,
      `내용은 ${VALIDATION.POST_CONTENT_MAX}자 이내로 입력해주세요.`,
    )
    .refine((val) => stripHtmlForValidation(val).length > 0, '내용을 입력해주세요.'),
});

/** 댓글 작성 검증 */
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(VALIDATION.COMMENT_MAX, `댓글은 ${VALIDATION.COMMENT_MAX}자 이내로 입력해주세요.`),
});

/** 검색 입력 검증 */
export const searchSchema = z.object({
  query: z.string().max(200, '검색어는 200자 이내로 입력해주세요.').optional().default(''),
});

export type PostFormValues = z.infer<typeof postSchema>;
export type CommentFormValues = z.infer<typeof commentSchema>;
export type SearchFormValues = z.infer<typeof searchSchema>;
