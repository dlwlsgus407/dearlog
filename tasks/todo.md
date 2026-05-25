# DEARLOG — 구현 TODO

> 마지막 업데이트: 2026-05-25
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

## Phase 5. AI 에이전트 연동 ← 현재 작업

> 에이전트 스펙 출처: `agents/01_interviewer.md` ~ `agents/07_calendar_trigger.md` (총 7개)

---

### 5-0. 공통 기반 세팅 (선행 필수)

#### 패키지 설치
- [x] `npm install openai uuid && npm install -D @types/uuid`

#### 환경변수
- [x] `.env.example` 생성 (`VITE_OPENAI_API_KEY=your_openai_api_key_here`)
- [x] `.gitignore`에 `.env`, `.env.local` 추가

#### 데모/실제 모드 토글
- [x] `src/store/devModeStore.ts` — `isDemoMode: true` 기본값, persist
- [x] `src/lib/agents/config.ts` — `isDemoMode()` 헬퍼 (getState 패턴)
- [x] `MyPageScreen.tsx` — 개발자 설정 섹션 추가 (ON=초록 데모 / OFF=주황 실제)

#### 타입 통합 — `src/types/agents.ts` 신규
```
[01 Interviewer]
  InterviewerResult { question, detectedKeywords, confidence }

[02 Archivist]
  MemoryChunk { raw, clean, tags, reliabilityLabel, chapterHint, timelinePosition }
  ArchivistResult { chunk, chunkId, createdAt }

[03 Digital Twin]
  ToneProfile { patterns, name }          ← 03·04 공통
  EvidenceBadge { usedChunkIds, reliability, note }
  DigitalTwinResult { responseText, questionType, evidenceBadge,
                      fallbackTriggered, suggestedInterviewTopic }

[04 Ghostwriter]
  Paragraph { paragraphId, text, sourceChunkIds, reliability, uncertaintyNote }
  GhostwriterResult { chapterId, chapterTitle, paragraphs,
                      missingSections, toneProfile }

[05 Verification]
  ConflictType = 'TIME_CONFLICT' | 'PERSON_CONFLICT' | 'FACT_CONFLICT' | 'DUPLICATE'
  Conflict { conflictType, conflictingChunkId, description, recommendedAction }
  VerificationResult { chunkId, status, reliabilityScore, uncertaintyFlag,
                       conflicts, verifiedAt }

[06 Question Queue]
  QuestionQueueResult { originalQuestion, reformulatedQuestion, priority,
                        isAnonymous, transformReason, sensitivityLevel, suggestedTopic }

[07 Calendar Trigger]
  EventType = '결혼식' | '졸업식' | '생일' | '기념일' | '기일' | '입학' | '출산'
  CalendarEvent { eventId, eventType, eventDate, relatedPersons, recipientId }
  EditedStory { text, sourceChunkIds, reliability }
  CalendarTriggerResult { eventId, triggerType, editedStory,
                          suggestedInterviewTopics, matchedChunkIds }
```

#### 기존 타입/스토어 수정
- [x] `src/types/agents.ts` 신규 — 모든 에이전트 타입 정의
- [x] `src/types/interview.ts` — `Transcript`에 `chunk?: MemoryChunk` 필드 추가 (하위호환 유지)
- [ ] `src/types/child.ts` — `ChildQuestion`에 `originalText?: string` 필드 추가
- [x] `src/store/interviewStore.ts` 수정 — `markQuestionCompleted(questionId, rawText?)` rawText 파라미터화
- [ ] `src/store/interviewStore.ts` — `addTranscript`, `getChapterCompletionRate`, `isChapterReady` 추가
- [x] `src/store/autobiographyStore.ts` **신규** — `chapters: GhostwriterResult[]`, persist 적용
- [ ] `src/store/calendarStore.ts` **신규**
  - `events: CalendarEvent[]`
  - `addEvent`, `removeEvent`, `getUpcomingEvents` 액션
  - Zustand persist 적용

---

### 5-1. Interviewer Agent — 꼬리질문 생성

**파일:** `src/lib/agents/interviewer.ts`  
**스펙:** `agents/01_interviewer.md`

- [x] 시스템 프롬프트 구현
  - 꼬리질문 우선순위 5단계: 인물→장소→감정→사건→시간
  - 금지 유형: 예/아니오, 복합질문, 감정단정, 유도형
- [x] `generateFollowUpQuestion(userAnswer, currentTopic, previousQuestions): Promise<InterviewerResult>`
  - `gpt-4o-mini`, max_tokens: 300, fallback 포함
- [ ] **`ParentInterviewScreen.tsx` 연동**
  - 통화 중(화면 3) "다음 질문" 버튼 클릭 시 호출
  - 호출 중 버튼 비활성화 + 로딩 인디케이터
  - 생성된 꼬리질문 → 화면의 현재 질문 텍스트 교체

---

### 5-2. Archivist Agent — 원문 구조화 + Verification 서브모듈

**파일:** `src/lib/agents/archivist.ts`, `src/lib/agents/verification.ts`  
**스펙:** `agents/02_archivist.md`, `agents/05_verification.md`

#### Archivist
- [x] 시스템 프롬프트 구현 — NER 4종 + 감정 8종 + 신뢰도 라벨
- [x] `archiveTranscript(rawText, sessionTopic, chapterId): Promise<ArchivistResult>`
  - `gpt-4o-mini`, max_tokens: 1000, uuid() chunkId, fallback 포함

#### Verification
- [x] 시스템 프롬프트 구현 — 충돌 유형 4종
- [x] `verifyChunk(newChunk, existingChunks): Promise<VerificationResult>`
  - 기존 chunks 0개면 즉시 PASS, slice(-10), fallback 포함

#### ParentInterviewScreen 연동
- [ ] 통화 완료(화면 4) 진입 시 순차 실행:
  ```
  archiveTranscript() → verifyChunk() → interviewStore.addTranscript()
  ```
- [ ] `status === 'FLAG'` 시 충돌 알림 카드 표시
  - 충돌 유형 + 설명 + 권장 조치 ("사용자 확인 요청" 등)
  - 확인 버튼 → 알림 닫기 (기록은 그대로 저장)
- [ ] 아카이빙 완료 → "저장됨" 토스트 메시지 (1초)

#### ParentTranscriptScreen 수정
- [ ] `aiSummary` 평문 → `chunk.clean` + `chunk.tags` 구조화 렌더링
  - NER 태그 뱃지 (인물 🟤 / 장소 🟢 / 시간 🔵 / 사건 🟠)
  - 신뢰도 라벨 색상: CONFIRMED(Sage) / ESTIMATED(Amber) / UNVERIFIED(회색)
- [ ] `VerificationResult.conflicts` 있으면 "검토 필요" 배너 표시

---

### 5-3. Question Queue Agent — 자녀 질문 재구성

**파일:** `src/lib/agents/questionQueue.ts`  
**스펙:** `agents/06_question_queue.md`

- [x] 시스템 프롬프트 구현 — 변환 원칙 4가지 + 예시 3가지
- [x] `reformulateQuestion(originalQuestion, priority, isAnonymous, currentTopic): Promise<QuestionQueueResult>`
  - `gpt-4o-mini`, max_tokens: 400, fallback: 원본 질문 그대로 반환
- [ ] **`ChildQuestionsScreen.tsx` 연동**
  - 질문 등록 버튼 클릭 시 호출
  - 호출 중 로딩 상태: "질문을 정리하고 있어요..." 텍스트
  - `childStore.addQuestion({ text: reformulatedQuestion, originalText: originalQuestion, ... })`
  - 재구성 완료 후 "등록됐어요 ✓" 피드백
  - `sensitivityLevel === 'high'` 시 미리보기: "이렇게 전달될 예정이에요" 모달

---

### 5-4. Calendar Trigger Agent — 이벤트 기반 기억 전달

**파일:** `src/lib/agents/calendarTrigger.ts`  
**스펙:** `agents/07_calendar_trigger.md`

- [x] 시스템 프롬프트 구현 — 이벤트 7종 + EVENT_KEYWORDS 맵
- [x] `processCalendarTrigger(event, memoryChunks): Promise<CalendarTriggerResult>`
  - `gpt-4o-mini`, max_tokens: 700, 관련 chunk 0개면 즉시 INTERVIEW, fallback 포함

#### CalendarScreen 수정
- [ ] 이벤트 등록 UI 추가 (현재 달력만 있음)
  - 날짜 선택 → 이벤트 유형 7종 선택 → 관련 인물 입력
  - 등록 시 `calendarStore.addEvent()` 저장
- [ ] 등록된 이벤트 날짜에 마커 표시
- [ ] 이벤트 탭 클릭 → 즉시 `processCalendarTrigger()` 호출
  - `DELIVERY` → 편집된 이야기 카드 표시 (자녀에게 공유 버튼)
  - `INTERVIEW` → "이 주제로 인터뷰해 보세요" 주제 목록 카드

#### useScheduledCall 확장
- [ ] D-1일 이벤트 감지 로직 추가
  - 매분 체크 시 `calendarStore.getUpcomingEvents(1일 후)` 조회
  - 해당 이벤트 있으면 `processCalendarTrigger()` 실행
  - `DELIVERY` 결과 → 알림 카드 (홈 화면 상단)
  - `INTERVIEW` 결과 → 인터뷰 세션 생성 알림

---

### 5-5. Digital Twin Agent — 페르소나 챗봇

**파일:** `src/lib/agents/digitalTwin.ts`  
**스펙:** `agents/03_digital_twin.md`

- [x] 시스템 프롬프트 구현 — 질문 유형 4종, fallback 문구 정의
- [x] `generatePersonaResponse(userQuestion, memoryChunks, toneProfile): Promise<DigitalTwinResult>`
  - UNVERIFIED 제외, 최대 5개, `gpt-4o-mini`, max_tokens: 500, fallback 포함
- [ ] **`ChatbotScreen.tsx` 신규 구현**
  - 상단: 시니어 이름 + 아바타 헤더
  - 말풍선: 왼쪽(시니어 응답, Surface `#FFFDF8`) / 오른쪽(자녀 질문, Peach Light `#F4DDD0`)
  - 시니어 응답 카드 하단: evidenceBadge 소형 뱃지 ("○○기억 기반 · HIGH")
  - `suggestedInterviewTopic` 있으면 하단 제안 칩: "이 주제 더 여쭤볼까요?" → `/child/questions`
  - `fallbackTriggered=true` → 응답 텍스트 회색 이탤릭 스타일
  - 스크롤 뷰 + 하단 고정 입력창 + 전송 버튼 (min-h-48px)
- [ ] `App.tsx`에 `/child/chatbot` 라우트 추가
- [ ] `ChildHomeScreen.tsx` 수정 — "대화하기" 진입 카드 추가 (BottomNav 변경 없음)

---

### 5-6. Ghostwriter Agent — 자서전 초안 생성

**파일:** `src/lib/agents/ghostwriter.ts`  
**스펙:** `agents/04_ghostwriter.md`

- [x] 시스템 프롬프트 구현 — CHAPTER_KEYWORDS 맵, 문체 규칙
- [x] `generateChapterDraft(chapterId, chapterTitle, chunks, toneProfile): Promise<GhostwriterResult>`
  - chunk 필터링(chapterHint || keywords), 0개면 즉시 반환, `gpt-4o-mini`, max_tokens: 1500
- [x] `src/store/autobiographyStore.ts` **신규** — `chapters: GhostwriterResult[]`, persist
- [ ] **`AutobiographyScreen.tsx` 신규 구현**
  - 상단 챕터 탭 (1장~5장)
  - 각 문단: 본문 + 신뢰도 뱃지 + 출처 chunk 수 ("기억 3개 기반")
  - `uncertaintyNote` 있으면 회색 이탤릭 주석
  - `missingSections` → "아직 기록되지 않은 구간" 점선 카드
  - 하단 "PDF 저장" 버튼 (Phase 6 연결 전: 비활성 + "준비 중" 툴팁)
- [ ] `App.tsx`에 `/parent/autobiography` 라우트 추가
- [ ] **`ParentProgressScreen.tsx` 수정**
  - "자서전 생성하기" 버튼 추가
  - 활성 조건: `isChapterReady()` 하나라도 true
  - 클릭 → `Promise.all(챕터별 generateChapterDraft)` 병렬 호출
  - 로딩 오버레이: "자서전을 쓰고 있어요..." (Amber Clay 스피너)
  - 완료 → `/parent/autobiography` 이동

---

### 구현 순서 (의존성 기반)
```
5-0 (공통 기반: 패키지·타입·스토어)
  → 5-1 Interviewer          (ParentInterview 연동)
  → 5-2 Archivist+Verify     (ParentInterview 완료 후 체인)
  → 5-3 Question Queue       (ChildQuestions 연동)
  → 5-4 Calendar Trigger     (CalendarScreen 확장)
  → 5-5 Digital Twin         (ChatbotScreen 신규)
  → 5-6 Ghostwriter          (AutobiographyScreen 신규)
```

**의존 관계:**
- 5-5 Digital Twin은 5-2 Archivist가 쌓은 MemoryChunk를 소비 → 5-2 먼저
- 5-6 Ghostwriter도 MemoryChunk 소비 → 5-2 먼저
- 5-4 Calendar Trigger도 MemoryChunk 사용 → 5-2 먼저
- 5-1 Interviewer는 독립적 → 어느 단계에서도 시작 가능

---

## Phase 6. 자서전 PDF 생성

### 6-1. PDF 렌더러 세팅
- [ ] `npm install @react-pdf/renderer`
- [ ] `src/components/AutobiographyPDF.tsx` — react-pdf 레이아웃
  - 커버 페이지: 이름, 생성일, DEARLOG 로고
  - 챕터별 본문: 제목 + 문단 + 신뢰도 각주
  - Noto Sans KR 폰트 임베드

### 6-2. PDF 다운로드 연동
- [ ] `AutobiographyScreen.tsx` — "PDF 저장" 버튼 → `PDFDownloadLink` 교체
- [ ] 다운로드 완료 토스트

---

## 리뷰 섹션

### Phase 0~4 회고 (2026-05-25 기준)
- Phase 0~4 모두 완료. 화면 26개, 스토어 5개, 타입 3개 구축됨.
- `src/lib/agents/` 폴더 미생성 → Phase 5-0에서 생성 시작.
- 현재 AI 기능 전부 setTimeout 모킹 → Phase 5에서 실제 Claude API로 교체.
- `agents/` 폴더: 7개 스펙 파일 존재 (01~07). 순서대로 모두 파악 완료.
- `Transcript`에 `chunk?: MemoryChunk` 추가 필요 (하위호환 유지).
- `ChildQuestion`에 `originalText?: string` 추가 필요 (06 Question Queue용).
- `interviewStore.markQuestionCompleted`가 rawText 하드코딩 → 파라미터화 필요.
- `calendarStore` 신규 필요 (07 Calendar Trigger + CalendarScreen 이벤트 등록).
- `autobiographyStore` 신규 필요 (06 Ghostwriter 결과 저장).
