# DEARLOG — AI 에이전트 기반 가족 자서전 솔루션

## 프로젝트 개요
시니어 세대의 구술 이야기를 수집·구조화하여
자서전(PDF)과 디지털 페르소나 챗봇으로 가족에게 전달하는 앱.

## 핵심 철학
"AI는 창작자가 아닌 보관자다."
모든 에이전트는 사용자가 실제로 말한 내용만 기반으로 작동한다.

## 기술 스택
- Frontend: React 19 + TypeScript + Vite
- 상태관리: Zustand (persist)
- 라우팅: react-router-dom
- 스타일: Tailwind CSS v4
- 폰트: Noto Sans KR (Google Fonts)
- AI: Claude API (claude-sonnet-4-20250514)

## 컬러 팔레트 (DEARLOG Warm Palette)
- Background:     #F8F3EA
- Surface:        #FFFDF8
- Primary:        #8B5E3C
- Primary Dark:   #6F4A30
- Peach Accent:   #EBC7A6
- Peach Light:    #F4DDD0
- Pale Sage:      #D9E0D2
- Muted Sage:     #C7D1BE
- Text Primary:   #3E3128
- Text Secondary: #7A6A5C
- Border:         #E7DED2
- Amber Clay:     #C8956C  ← CTA 버튼
- Sage:           #6B8F71  ← 성공 상태
- Sepia Tint:     #F2D9B8  ← 기억 카드 배경

## 사용자 구조
- 부모 (이야기 주인): 인터뷰 대상, 원문 보존, 출판 최종 승인
- 자녀 (기록 참여자): 질문 등록, 사진 업로드, 챕터 편집
- 가족 그룹이 공유 단위 → 같은 RAG·챗봇 공유

## 화면 구성

### 온보딩 (공통 진입)
1. 메인 화면 (로고·서비스명)
2. 앱 소개 미리보기 (스크롤)
3. 가입·로그인 (데모 ver.)
4. 모드 선택 (부모/자녀 — 넷플릭스 프로필 UI 참고)

### 부모 모드
- 메인 (오늘의 인터뷰 카드, 전체 진척도)
- 인터뷰 답변하기 (전화 · 음성 메시지)
- 진척도·챕터 확인
- 음성 원문 기록 확인 + AI 정리본 비교

### 자녀 모드
- 메인 (알림, 진척도 요약)
- 인터뷰 질문 등록 (익명·우선순위 설정)
- 사진 올리기 (AI 질문 자동 생성)
- 진척도 확인
- 챕터 확인

### 공통
- 마이페이지 (인적사항)
- 캘린더 (선택 구현)

## 진척도 시스템
기간이 아닌 완료율 기반.
챕터별 질문 N개 중 M개 완료 시 해당 챕터 자서전 생성 가능.

## 폴더 구조
src/
├── pages/        # 각 화면 컴포넌트
├── components/   # 공용 UI 컴포넌트
├── lib/agents/   # AI 에이전트 로직
├── store/        # Zustand 상태관리
└── types/        # TypeScript 타입 정의

## 코딩 규칙
- 컬러는 반드시 위 팔레트만 사용, 임의 색상 금지
- 폰트는 항상 Noto Sans KR
- 모바일 우선 (max-width: 390px 기준)
- 시니어 UI: 최소 글씨 16px, 버튼 최소 48px 높이
- 컴포넌트 파일명: PascalCase
- 모든 타입은 src/types/에서 관리

## Workflow Rules

### 1. Plan First
- 3단계 이상 작업은 반드시 tasks/todo.md에 계획 먼저 작성
- 아키텍처 결정 전 플랜 모드 진입
- 문제 발생 시 즉시 중단 후 재플래닝

### 2. Subagent Strategy
- 복잡한 문제는 서브에이전트로 분리해 메인 컨텍스트 보호
- 리서치·탐색·병렬 분석은 서브에이전트에 위임
- 서브에이전트 하나당 하나의 태스크만

### 3. Self-Improvement Loop
- 사용자 수정 발생 시: tasks/lessons.md 즉시 업데이트
- 같은 실수 반복 방지 규칙 작성
- 세션 시작 시 lessons.md 복습

### 4. Verification Before Done
- 완료 표시 전 반드시 동작 증명
- "스태프 엔지니어가 승인할 코드인가?" 자문
- 테스트 실행, 로그 확인, 동작 시연

### 5. Demand Elegance
- 비자명한 변경 전: "더 우아한 방법이 있는가?" 자문
- 핵 같은 느낌이 들면: 알고 있는 모든 것으로 우아한 해법 구현
- 단순하고 명백한 수정은 과설계 금지

### 6. Autonomous Bug Fixing
- 버그 리포트 받으면 바로 수정. 안내 요청 금지
- 로그·에러·실패 테스트 직접 분석 후 해결

### 7. Task Management
1. Plan First: tasks/todo.md에 체크리스트 작성
2. Verify Plan: 구현 전 확인
3. Track Progress: 완료 항목 즉시 체크
4. Explain Changes: 각 단계 요약 설명
5. Document Results: tasks/todo.md에 리뷰 섹션 추가
6. Capture Lessons: 수정 후 tasks/lessons.md 업데이트

## Core Principles
- Simplicity First: 모든 변경은 최대한 단순하게. 최소한의 코드만 건드릴 것
- No Laziness: 근본 원인 찾기. 임시 수정 금지. 시니어 개발자 기준 적용
- Minimal Impact: 필요한 것만 변경. 불필요한 버그 유입 금지