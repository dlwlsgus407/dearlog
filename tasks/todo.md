# DEARLOG — 구현 TODO

> 마지막 업데이트: 2026-05-24
> 기준: CLAUDE.md 화면 구성 + 기술 스택

---

## Phase 0. 프로젝트 기반 세팅
- [x] 폴더 구조 생성 (`pages/`, `components/`, `lib/agents/`, `store/`, `types/`)
- [x] Tailwind CSS v4 설정 (컬러 팔레트, Noto Sans KR 폰트) — 이미 완료 확인
- [x] react-router-dom 라우팅 설정 (`App.tsx` 정리)
- [x] Zustand 스토어 기본 구조 (`store/authStore.ts`)
- [x] 공용 타입 정의 (`types/user.ts`)
- [x] 기본 공용 컴포넌트 (`Button`)

---

## Phase 1. 온보딩 흐름

### 전체 플로우
```
/ (SplashScreen)
  └─▶ /intro (IntroScreen)
        └─▶ /auth (AuthScreen)
              └─▶ /select-mode (SelectModeScreen)
                    ├─▶ /parent (부모 메인)
                    └─▶ /child  (자녀 메인)
```

### 선행 작업 (Phase 0에서 처리)
- [x] `index.css`에 CSS 변수로 팔레트 등록 및 Noto Sans KR import
- [x] `src/types/user.ts` — `UserRole('parent'|'child')`, `User` 타입 정의
- [x] `src/store/authStore.ts` — `role`, `userName`, `setRole`, `setUserName` (persist)
- [x] `src/components/Button.tsx` — 공용 CTA 버튼 (amber-clay, 48px 이상, full-width 옵션)

### Step 1 — SplashScreen (`/splash`) ✅
**파일**: `src/pages/SplashScreen.tsx`
**내용**
- [x] 배경색: `#F8F3EA` (Background)
- [x] 중앙 로고 SVG + 서비스명 "DEARLOG" (Primary `#8B5E3C`, 28px bold)
- [x] 슬로건: "당신의 이야기를 기록합니다" (Text Secondary, 16px)
- [x] 하단 CTA 버튼 "시작하기" → `/intro` 이동
- [x] 로고 영역 페이드인 애니메이션 (0.7s)

### Step 2 — IntroScreen (`/intro`) ✅
**파일**: `src/pages/IntroScreen.tsx`
**내용**
- [x] 슬라이드 3장 (인덱스 기반 수평 캐러셀 — 모바일 UX 판단)
- [x] 슬라이드 1: "가족의 이야기를 보존하세요" + 아이콘
- [x] 슬라이드 2: "AI가 구조화, 원문은 그대로" + 아이콘
- [x] 슬라이드 3: "자서전으로, 챗봇으로 남깁니다" + 아이콘
- [x] 하단 점 인디케이터 + "다음"/"시작하기" 버튼
- [x] 상단 우측 "건너뛰기" 링크

### Step 3 — AuthScreen (`/auth`) ✅
**파일**: `src/pages/AuthScreen.tsx`
**내용**
- [x] 탭 2개: "로그인" / "회원가입" (기본: 로그인)
- [x] 입력 필드: 이름 (공통), 전화번호 (회원가입만)
- [x] 데모 모드: authStore에 이름 저장 후 /select-mode 이동
- [x] 입력창 min-h-52px, 레이블 16px

### Step 4 — SelectModeScreen (`/select-mode`) ✅
**파일**: `src/pages/SelectModeScreen.tsx`
**내용**
- [x] 넷플릭스 프로필 UI: 카드 2개 나란히
- [x] 부모 카드: SVG 아바타 + "부모님" + "이야기를 들려주세요"
- [x] 자녀 카드: SVG 아바타 + "자녀" + "이야기를 기록해요"
- [x] 선택 시 Amber Clay 테두리 강조
- [x] "선택 완료" 버튼 → authStore role 저장 → /parent or /child

### 라우팅 설정 (`App.tsx`)
```
<Routes>
  <Route path="/"            element={<SplashScreen />} />
  <Route path="/intro"       element={<IntroScreen />} />
  <Route path="/auth"        element={<AuthScreen />} />
  <Route path="/select-mode" element={<SelectModeScreen />} />
  {/* Phase 2~3에서 추가 */}
</Routes>
```

### 구현 순서
1. Phase 0 선행 작업 (CSS 변수, 타입, 스토어, Button 컴포넌트)
2. SplashScreen
3. IntroScreen
4. AuthScreen
5. SelectModeScreen
6. 전체 플로우 연결 확인

---

## Phase 2. 부모 모드 ✅ 완료 (2026-05-22)
- [x] `src/types/interview.ts` — Question, Chapter, Transcript 타입
- [x] `src/store/interviewStore.ts` — Zustand persist, 4챕터 16문항 데모 데이터
- [x] `src/components/BottomNav.tsx` — 홈/인터뷰/진척도/원문기록 탭 (fixed, 390px 맞춤)
- [x] `/parent` — 메인 (오늘의 인터뷰 카드, 전체 진척도 바, 최근 기억 카드)
- [x] `/parent/interview` — 인터뷰 답변하기 (전화 통화 UI + 음성 메시지 Hold-to-Record UI)
- [x] `/parent/progress` — 진척도 (원형 전체%, 챕터별 바 + 질문 펼치기)
- [x] `/parent/transcript` — 원문 기록 목록 + 원문/AI정리본 비교 모달

### ParentInterviewScreen 전면 재설계 ✅ 완료 (2026-05-23)
- [x] `src/store/scheduledCallStore.ts` — 예약 전화 설정 (시간/요일/활성화/마지막 통화일)
- [x] `src/hooks/useScheduledCall.ts` — 매분 체크, 조건 충족 시 /parent/interview?type=scheduled 이동
- [x] `src/App.tsx` — ScheduledCallMonitor 컴포넌트 등록 (BrowserRouter 내부)
- [x] 화면 1 — 방식 선택 (음성/전화 카드 UI)
- [x] 화면 2 — 수신 전화 (iPhone 다크 UI, type별 자막, 거절/수락)
- [x] 화면 3 — 통화 중 (STT 타이핑 애니메이션, iPhone 버튼 그리드, 진행 도트)
- [x] 화면 4 — 완료 (다크→크림 전환, SVG 체크 애니메이션)
- [x] `/parent` 홈 — 인터뷰 시간 설정 카드 (time picker, 요일 토글, 다음 예정 표시, 1분 후 테스트)

---

## Phase 3. 자녀 모드 ✅ 완료 (2026-05-23)
- [x] `src/types/child.ts` — ChildQuestion, DemoPhoto 타입
- [x] `src/store/childStore.ts` — Zustand persist, 데모 질문 3개 초기 데이터
- [x] `src/components/ChildBottomNav.tsx` — 5탭 (홈/질문등록/사진/진척도/챕터)
- [x] `/child` — 메인 (새 답변 알림 카드, 진척도 요약, 등록 질문 현황)
- [x] `/child/questions` — 질문 등록 (텍스트 입력 + 우선순위 3단계 + 익명 토글 + 목록)
- [x] `/child/photos` — 사진 올리기 (업로드 데모 + AI 2초 분석 + 질문 자동 생성 + 등록)
- [x] `/child/progress` — 진척도 (원형 전체% + 내 질문 현황 + 챕터별 바)
- [x] `/child/chapters` — 챕터 확인 (답변 열람 + 원문/AI정리 탭 + 수정 제안 폼)

---

## Phase 4. 공통 화면
- [x] `/mypage` — 마이페이지 (인적사항) ✅ 완료 (2026-05-23), 동의 설정 답변별 개별 토글로 개편 (2026-05-24)
- [x] `/calendar` — 캘린더 ✅ 완료 (2026-05-24)

---

## Phase 5. AI 에이전트 연동
- [ ] Claude API 설정 (`lib/agents/`)
- [ ] 인터뷰 질문 생성 에이전트
- [ ] 음성 원문 → AI 정리본 변환 에이전트
- [ ] 사진 업로드 → 질문 자동 생성 에이전트
- [ ] RAG 기반 디지털 페르소나 챗봇

---

## Phase 6. 자서전 생성
- [ ] 챕터별 완료율 계산 로직
- [ ] 챕터 자서전 생성 (PDF export)

---

## 리뷰 섹션
<!-- 각 Phase 완료 후 회고 기록 -->
