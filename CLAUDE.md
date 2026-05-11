# CLAUDE.md — 은둔마을 통합 레포

**이 레포는 모바일(React Native/Expo) + 웹(Expo Web) + DB 관리(Supabase)를 모두 포함하는 단일 레포다.**
이전에는 `supabase-hermit` (DB 중앙관리), `web-hermit-comm` (Next.js 웹), `gns-hermit-comm` (앱) 3개 레포로 분리되어 있었으나 이 레포로 통합됨.

**언어**: 응답·주석·문서·사용자 facing 문자열 모두 한국어.

---

## 1. 프로젝트 구조

```
gns-hermit-comm/
├── supabase/
│   ├── config.toml
│   ├── migrations/          # 47개 마이그레이션 (베이스라인~v4)
│   └── functions/           # Edge Functions (analyze-post 등)
├── scripts/
│   ├── db.sh                # push/pull/diff/lint/status/gen-types
│   ├── gen-types.sh         # DB 스키마 → TypeScript 타입
│   └── pre-build-check.sh   # EAS 빌드 전 사전점검
├── docs/
│   ├── SCHEMA.md            # DB 스키마 상세
│   ├── SERVICES.md          # 연동 서비스 플랜/비용
│   ├── audit/               # 코드 감사 스냅샷 (새 대화 시 먼저 읽기)
│   └── archive/             # 완료된 설계 문서
├── src/
│   ├── app/                 # Expo Router (모바일 + 웹 라우트)
│   ├── features/            # 기능 모듈 (posts, comments, my, auth, search 등)
│   ├── shared/              # 공통 컴포넌트, 훅, 유틸, API
│   └── types/               # 타입 정의
├── app.config.js
├── package.json
└── .env                     # SUPABASE_ACCESS_TOKEN, EXPO_PUBLIC_* 등
```

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 모바일 | React Native, Expo SDK 55, TypeScript |
| 웹 | Expo Web (React Native Web, Expo Router) |
| 스타일 | NativeWind v4 (Tailwind) |
| 라우팅 | Expo Router (파일 기반, 모바일+웹 공용) |
| 서버 상태 | TanStack Query v5 |
| 백엔드 | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| 폼/검증 | React Hook Form, Zod |
| 에디터 (앱) | @10play/tentap-editor (TenTap) |
| 에디터 (웹) | @tiptap/react (ContentEditor.web.tsx) |
| 본문 표시 | react-native-render-html (앱), dangerouslySetInnerHTML (웹) |
| 모니터링 | @sentry/react-native |
| 경로 별칭 | `@/` → `src/` |

---

## 3. 폴더 구조 (src/)

```
src/
├── app/
│   ├── _layout.tsx            # 루트 레이아웃 (Sentry, Auth, ErrorBoundary)
│   ├── (tabs)/
│   │   ├── _layout.tsx        # 탭 네비게이션
│   │   ├── _layout.web.tsx    # 웹용 Header 네비게이션
│   │   ├── index.tsx          # 홈 (피드)
│   │   ├── search.tsx         # 검색
│   │   ├── create.tsx         # 글쓰기 (탭바 숨김)
│   │   └── my.tsx             # 마이페이지
│   ├── post/[id].tsx          # 게시글 상세
│   ├── post/edit/[id].tsx     # 게시글 수정
│   ├── notifications.tsx      # 알림
│   ├── admin/                 # 관리자
│   └── search.tsx             # 검색 화면
├── features/
│   ├── auth/                  # 인증 (익명 로그인)
│   ├── boards/                # 게시판 API/훅
│   ├── posts/                 # 게시글 컴포넌트/훅
│   ├── comments/              # 댓글
│   ├── my/                    # 마이페이지
│   ├── notifications/         # 알림
│   ├── search/                # 검색
│   └── admin/                 # 관리자
├── shared/
│   ├── components/
│   │   ├── composed/          # ContentEditor, SectionErrorBoundary, ScreenHeader 등
│   │   └── primitives/        # Button, Input, Loading, Skeleton 등
│   ├── hooks/                 # useThemeColors, useTabBarHeight 등
│   ├── lib/                   # supabase, api, queryClient, constants, navigation
│   └── utils/                 # format, validate, html, logger
└── types/
    ├── database.gen.ts        # 자동 생성 (gen-types.sh 산출물)
    ├── database.types.ts      # 비즈니스 타입 (Post, Comment, Notification 등)
    └── index.ts
```

---

## 4. 탭 구조

```
모바일: 하단 탭바  홈 | 검색 | (글쓰기 hidden) | 나
웹:     상단 Header  홈 | 글쓰기 | 🔔 | 나
```

화면 전환 애니메이션:

| 화면 | 애니메이션 |
|------|----------|
| (tabs) | none |
| post/[id] | ios_from_right + gesture |
| post/edit/[id] | slide_from_bottom (modal) |
| search | fade 200ms |
| 기타 | slide_from_right 250ms |

---

## 5. DB 스키마 요약

### 테이블 (10개)
| 테이블 | 설명 |
|--------|------|
| `boards` | 게시판 (id=1,2,12; 익명모드 설정) |
| `posts` | 게시글 (소프트삭제, 감정분석, post_type: post/daily, **created_date_kst** generated) |
| `comments` | 댓글 (소프트삭제, **parent_id로 1단계 답글**) |
| `reactions` | 리액션 집계 (post_id + reaction_type 별 count) |
| `user_reactions` | 사용자별 리액션 기록 |
| `post_analysis` | AI 감정 분석 결과 (emotions 배열, status/retry_count) |
| `user_preferences` | 사용자 설정 (감정 선호, display_alias, longest_streak) |
| `app_admin` | 앱 관리자 |
| `notifications` | In-App 알림 (reaction/comment/reply) |
| `user_blocks` | 사용자 차단 (blocker_id + blocked_alias) |

### 뷰
- `posts_with_like_count` — 게시글 + 좋아요수 + 댓글수 + 감정 (security_invoker)

### 주요 RPC
`toggle_reaction`, `soft_delete_post`, `soft_delete_comment`, `create_daily_post`, `update_daily_post`, `get_today_daily`, `get_my_alias`, `get_notifications`, `block_user`, `search_posts_v2`, `get_my_streak`, `get_monthly_emotion_report` 외 35개 (상세: `docs/SCHEMA.md`)

---

## 6. 개발 명령어

```bash
# 앱 개발 서버
npm start
npm run android
npm run web                  # Expo Web 개발 서버

# 웹 빌드 (Vercel 배포용)
npm run build:web            # expo export -p web → dist/

# 타입 체크
npm run type-check           # tsc --noEmit

# 린트/테스트
npm run lint
npm test
npm run test:coverage

# DB 관리 (supabase-hermit 통합)
npm run db:push              # migration 적용 + gen-types
npm run db:push:dry          # dry-run
npm run db:pull              # remote → local
npm run db:lint              # RLS/스키마 린트
npm run db:status            # migration 상태
npm run db:gen-types         # 타입 재생성만
```

---

## 7. 플랫폼별 파일 전략 (Expo Web)

Expo는 `.web.tsx` > `.tsx` 자동 우선 해석. 이 방식으로 플랫폼 분기:

| 파일 | 설명 |
|------|------|
| `ContentEditor.tsx` | 네이티브 (@10play/tentap-editor) |
| `ContentEditor.web.tsx` | 웹 (@tiptap/react) |
| `PostList.tsx` | 네이티브 (FlashList) |
| `PostList.web.tsx` | 웹 (FlatList) |
| `(tabs)/_layout.web.tsx` | 웹 Header 네비게이션 |

NativeWind v4 platform modifier:
```tsx
className="pb-2 ios:pb-7 web:pb-0 web:max-w-2xl web:mx-auto"
```

---

## 8. 데이터 페칭 원칙

- 서버 데이터는 **TanStack Query로만** 조회·캐싱·재검증
- API 계층: `shared/lib/api/` 하위 모듈별 분리
- 실시간: `useRealtimePosts`, `useRealtimeComments` → `queryClient.setQueryData` 또는 `invalidateQueries`
- **리액션은 RPC만**: `toggle_reaction()` 사용. 직접 INSERT/UPDATE 금지
- **삭제는 소프트삭제**: `soft_delete_post()`, `soft_delete_comment()` 사용

---

## 9. 마이그레이션 작성 규칙

```bash
# 새 마이그레이션 파일 작성 후
npm run db:push:dry          # dry-run 확인
npm run db:push              # 적용 (자동 gen-types 실행)
```

- **멱등 패턴**: `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`
- **마이그레이션 추가 시**: CLAUDE.md 스키마 요약 + docs/SCHEMA.md 즉시 업데이트

---

## 10. 배포

### 모바일 (EAS)
```bash
# 사전점검
bash scripts/pre-build-check.sh

# OTA (JS/UI만 변경)
npm run update:production

# 스토어 빌드 (네이티브 변경 포함)
eas build --platform android --profile production --auto-submit
```

### 웹 (Vercel)
```bash
npm run build:web            # expo export -p web
vercel --prod                # 수동 배포 (자동 배포 Canceled 빈번)
```

### Edge Functions
```bash
supabase functions deploy analyze-post --no-verify-jwt
```

---

## 11. 규칙

- **같은 명령 3번 반복 금지** — 2번 실패 시 원인 분석 후 다른 방법
- **에러 진단**: 실제 에러 메시지 먼저 확보 → 추측 기반 수정 금지
- **배포 확인 필수**: 코드 수정 후 항상 배포 상태 확인
- **테스트 데이터 즉시 삭제**
- **generated 파일 직접 편집**: `constants.generated.ts`, `utils.generated.ts`, `database.types.ts`는 이제 직접 편집 가능 (sync 없음)
- **boards id 시퀀스**: 1, 2, 12 (13은 시 게시판으로 추가 후 제거됨)

---

## 12. 연결 정보

- Supabase Project ref: `qwrjebpsjjdxhhhllqcw`
- 웹 레포 (구, 폐기 예정): `/home/gunny/apps/web-hermit-comm`
- Vercel 프로젝트: 도메인 전환 예정

---

## 상세 문서

- `docs/SCHEMA.md` — DB 스키마 전체 상세
- `docs/SERVICES.md` — 연동 서비스 플랜/비용/토큰
- `docs/audit/` — 코드 감사 스냅샷 (새 대화 시 먼저 읽기)
- `docs/CLIENT-ARCHITECTURE.md` — 클라이언트 연동 아키텍처
- `docs/archive/` — 완료된 설계 문서
