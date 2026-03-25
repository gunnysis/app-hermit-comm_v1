import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { Container } from '@/shared/components/primitives/Container';
import { Input } from '@/shared/components/primitives/Input';
import { ContentEditor } from '@/shared/components/composed/ContentEditor';
import { Button } from '@/shared/components/primitives/Button';
import { useCreatePost } from '@/features/posts/hooks/useCreatePost';
import { useDraft } from '@/features/posts/hooks/useDraft';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useBoards } from '@/features/boards/hooks/useBoards';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEFAULT_PUBLIC_BOARD_ID, POETRY_BOARD_ID } from '@/shared/lib/constants';
import { pushTabs } from '@/shared/lib/navigation';
import Toast from 'react-native-toast-message';

type CreateType = 'post' | 'poem';

const CREATE_TABS: { type: CreateType; label: string }[] = [
  { type: 'post', label: '📝 글쓰기' },
  { type: 'poem', label: '🪶 시 쓰기' },
];

export default function CreateScreen() {
  const [selectedType, setSelectedType] = useState<CreateType>('post');

  return (
    <Container>
      <StatusBar style="auto" />
      {/* 탭 선택 */}
      <View className="flex-row gap-2 px-4 pt-4 pb-2">
        {CREATE_TABS.map((tab) => (
          <Pressable
            key={tab.type}
            onPress={() => setSelectedType(tab.type)}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              selectedType === tab.type
                ? 'bg-stone-800 dark:bg-stone-100'
                : 'bg-stone-100 dark:bg-stone-800'
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedType === tab.type }}>
            <Text
              className={`text-sm font-medium ${
                selectedType === tab.type
                  ? 'text-white dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <RegularCreateForm
        boardId={selectedType === 'poem' ? POETRY_BOARD_ID : DEFAULT_PUBLIC_BOARD_ID}
        isPoetry={selectedType === 'poem'}
      />
    </Container>
  );
}

interface RegularCreateFormProps {
  boardId: number;
  isPoetry?: boolean;
}

function RegularCreateForm({ boardId, isPoetry = false }: RegularCreateFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { data: boards } = useBoards();

  const board = boards?.find((b) => b.id === boardId);
  const anonMode = board?.anon_mode ?? 'always_anon';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    handleContentChange,
    errors,
    isSubmitting,
    onSubmit: handleFormSubmit,
  } = useCreatePost({
    boardId,
    user,
    anonMode,
    getExtraPostData: () => ({}),
    onSuccess: async () => {
      clearDraft();
      Toast.show({
        type: 'success',
        text1: isPoetry ? '시가 작성되었습니다. ✓' : '게시글이 작성되었습니다. ✓',
      });
      pushTabs(router);
    },
    onError: (message) => Alert.alert('오류', message),
  });

  const watched = watch();
  const { loadDraft, clearDraft } = useDraft(boardId, {
    title: watched.title ?? '',
    content: watched.content ?? '',
  });

  const draftCheckedRef = React.useRef(false);
  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    const draft = loadDraft();
    if (!draft) return;
    Alert.alert('임시저장된 글', '임시저장된 글이 있습니다. 복원할까요?', [
      { text: '취소', style: 'cancel', onPress: () => clearDraft() },
      {
        text: '복원',
        onPress: () => {
          setValue('title', draft.title);
          setValue('content', draft.content);
        },
      },
    ]);
  }, [loadDraft, clearDraft, setValue]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + (isWide ? 0 : 48) : insets.top}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}>
        <View
          className={`bg-peach-100 dark:bg-stone-900 px-4 ${isWide ? 'pt-6' : 'pt-4'} pb-6 border-b border-cream-200 dark:border-stone-700`}>
          <View className="flex-row items-center">
            <Text className="text-3xl mr-2">{isPoetry ? '🪶' : '✍️'}</Text>
            <Text className="text-3xl font-bold text-gray-800 dark:text-stone-100">
              {isPoetry ? '시 쓰기' : '게시글 작성'}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-stone-400 mt-2">
            {isPoetry ? '마음을 시로 표현해보세요' : '따뜻한 이야기를 나눠주세요'}
          </Text>
          {board?.description ? (
            <Text className="text-xs text-gray-500 dark:text-stone-400 mt-1" numberOfLines={2}>
              {board.description}
            </Text>
          ) : null}
        </View>

        <View className="p-4 pb-2">
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <Input
                label="제목"
                value={value}
                onChangeText={onChange}
                placeholder={isPoetry ? '시의 제목' : '멋진 제목을 입력하세요 ✨'}
                error={errors.title?.message}
                maxLength={100}
              />
            )}
          />

          <Controller
            control={control}
            name="content"
            render={({ field: { value } }) => (
              <ContentEditor
                label={isPoetry ? '시' : '내용'}
                value={value}
                onChange={handleContentChange}
                placeholder={isPoetry ? '시를 작성해보세요...' : '이야기를 들려주세요 💭'}
                error={errors.content?.message}
                maxLength={5000}
                accessibilityLabel="본문"
                accessibilityHint={isPoetry ? '시를 입력합니다' : '리치 텍스트로 내용을 입력합니다'}
              />
            )}
          />

          <View className="mt-2 mb-2">
            <Text className="text-xs text-gray-500 dark:text-stone-400">
              모든 게시글은 익명으로 작성됩니다. 게시판별 고유 별칭이 자동 부여돼요.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 pb-4 pt-2 bg-cream-50 dark:bg-stone-900 border-t border-cream-200 dark:border-stone-700">
        <Button
          title={isPoetry ? '시 등록하기 🪶' : '작성하기 🎨'}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          accessibilityLabel={isPoetry ? '시 등록하기' : '게시글 작성하기'}
          accessibilityHint={
            isPoetry ? '입력한 시를 등록합니다' : '입력한 제목과 내용으로 게시글을 등록합니다'
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}
