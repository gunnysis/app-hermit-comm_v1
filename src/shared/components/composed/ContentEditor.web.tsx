import React, { useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { ContentEditorProps } from './ContentEditor';

export type { ContentEditorProps };

const DEFAULT_MAX_LENGTH = 5000;

/** HTML 태그/엔티티를 제거한 순수 텍스트 길이 */
function textLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, 'X')
    .trim().length;
}

const TOOLBAR_BTN =
  'px-2.5 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer select-none ';
const ACTIVE_BTN = 'bg-stone-700 text-white ';
const INACTIVE_BTN = 'text-stone-300 hover:bg-stone-700/60 hover:text-white ';

export function ContentEditor({
  value,
  onChange,
  placeholder,
  error,
  maxLength = DEFAULT_MAX_LENGTH,
  editable = true,
  label,
  accessibilityLabel = label,
  accessibilityHint,
  minHeight = 200,
}: ContentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: value || '',
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // 외부 value가 바뀔 때만 동기화 (편집 중 overwrite 방지)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const htmlContent = editor?.getHTML() ?? value;
  const currentLength = textLength(htmlContent);
  const isOverLimit = currentLength > maxLength;
  const charPercent = Math.min((currentLength / maxLength) * 100, 100);
  const readTimeMin = Math.max(1, Math.ceil(currentLength / 500));

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(
    () => editor?.chain().focus().toggleUnderline().run(),
    [editor],
  );
  const toggleBullet = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor],
  );

  return (
    <View className="mb-4" aria-label={accessibilityLabel} aria-description={accessibilityHint}>
      {label ? (
        <Text className="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-2">
          {label}
        </Text>
      ) : null}

      <View
        className={`rounded-2xl border-2 overflow-hidden ${
          error ? 'border-coral-500' : 'border-cream-200 dark:border-stone-600'
        }`}
        style={{ minHeight }}>
        {/* 툴바 */}
        <View className="bg-stone-800 border-b border-stone-700 px-2 py-1 flex-row gap-1 web:flex-row web:flex-wrap">
          <button
            type="button"
            onClick={toggleBold}
            className={TOOLBAR_BTN + (editor?.isActive('bold') ? ACTIVE_BTN : INACTIVE_BTN)}
            title="굵게 (Ctrl+B)">
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={TOOLBAR_BTN + (editor?.isActive('italic') ? ACTIVE_BTN : INACTIVE_BTN)}
            title="기울임 (Ctrl+I)">
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={toggleUnderline}
            className={TOOLBAR_BTN + (editor?.isActive('underline') ? ACTIVE_BTN : INACTIVE_BTN)}
            title="밑줄 (Ctrl+U)">
            <u>U</u>
          </button>
          <div className="w-px bg-stone-600 mx-1 self-stretch" />
          <button
            type="button"
            onClick={toggleBullet}
            className={TOOLBAR_BTN + (editor?.isActive('bulletList') ? ACTIVE_BTN : INACTIVE_BTN)}
            title="목록">
            ≡
          </button>
        </View>

        {/* 에디터 본문 */}
        <style>{`
          .tiptap-content { outline: none; }
          .tiptap-content p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
            float: left;
            height: 0;
          }
        `}</style>
        <EditorContent
          editor={editor}
          className="tiptap-content bg-cream-50 dark:bg-stone-900 flex-1 p-3 text-base text-stone-900 dark:text-stone-100"
          style={{ minHeight: 180 }}
          placeholder={placeholder}
        />
      </View>

      {/* 하단 바: 읽기 시간 + 글자수 + 프로그레스 바 */}
      <View className="flex-row items-center justify-between mt-1.5 px-1">
        <Text className="text-xs text-gray-400 dark:text-stone-500">
          {currentLength > 0 ? `약 ${readTimeMin}분 읽기` : ''}
        </Text>
        <View className="flex-row items-center">
          <Text
            className={`text-xs ${isOverLimit ? 'text-coral-500' : 'text-gray-500 dark:text-stone-400'}`}>
            {currentLength} / {maxLength}자
          </Text>
          {charPercent > 0 && (
            <View className="ml-2 w-10 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  isOverLimit ? 'bg-coral-500' : charPercent > 80 ? 'bg-amber-400' : 'bg-stone-400'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </View>
          )}
        </View>
      </View>

      {error ? (
        <Text className="text-xs text-coral-500 dark:text-coral-400 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
