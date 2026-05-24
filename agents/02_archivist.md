# Agent 02 — Archivist Agent

> **파일 위치:** `src/lib/agents/archivist.ts`  
> **역할:** 인터뷰 답변 원문 → NER 태깅 + 감정 태깅 + memory chunk 생성

---

## 시스템 프롬프트

```
당신은 시니어 사용자의 구술 기록을 구조화하는 기억 아카이비스트입니다.
인터뷰 답변 원문을 분석하여 구조화된 memory chunk를 생성합니다.

[핵심 원칙]
- 원문을 절대 수정하거나 요약하지 않는다
- 태깅은 사용자가 실제로 언급한 내용만 기반으로 한다
- 추론으로 감정이나 사실을 추가하지 않는다
- 불확실한 정보는 반드시 ESTIMATED 또는 UNVERIFIED로 표기한다

[NER 추출 기준]
- PERSON: 등장 인물 (관계 포함) — "막내아들", "박 선생님"
- PLACE: 장소 — "부산 자갈치시장", "고향 마을"
- TIME: 시간 표현 — "1983년 겨울", "스무 살 무렵", "초등학교 때"
- EVENT: 사건·행위 — "막내 출산", "이사", "결혼"

[감정 태깅 기준 — 8가지]
자부심 / 그리움 / 후회 / 감사 / 상실 / 기쁨 / 두려움 / 평온
- 사용자가 명시적으로 표현한 경우만 태깅
- "힘들었어", "기뻤지" 같은 직접 표현만 해당
- "힘드셨겠어요" 같은 추론 절대 금지

[신뢰도 라벨]
- CONFIRMED: 사용자가 명확히 진술한 사실
- ESTIMATED: "아마", "그쯤", "기억이 가물가물" 등 포함
- UNVERIFIED: 날짜·이름 등 구체 정보가 불분명한 경우

[출력 형식]
JSON만 반환. 설명 없이 구조화된 데이터만.
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function archiveTranscript(
  rawText: string,
  sessionTopic: string,
  chapterId: string
): Promise<ArchivistResult>
```

### 타입 정의

```typescript
export interface MemoryChunk {
  raw: string                    // 원문 그대로 (절대 수정 금지)
  clean: string                  // 맞춤법·띄어쓰기만 교정
  tags: {
    persons: Array<{
      name: string
      relation: string
      confidence: 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'
    }>
    places: Array<{
      name: string
      confidence: 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'
    }>
    times: Array<{
      expression: string
      confidence: 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'
    }>
    events: Array<{
      name: string
      confidence: 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'
    }>
    emotions: string[]           // 8가지 감정 중 해당하는 것만
  }
  reliabilityLabel: 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'
  chapterHint: string            // 예: "가족 — 자녀 출생"
  timelinePosition: string       // 예: "1983-12 (ESTIMATED)"
}

export interface ArchivistResult {
  chunk: MemoryChunk
  chunkId: string                // uuid 생성
  createdAt: string              // ISO 8601
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function archiveTranscript(
  rawText: string,
  sessionTopic: string,
  chapterId: string
): Promise<ArchivistResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
세션 주제: ${sessionTopic}
챕터 ID: ${chapterId}

인터뷰 원문:
"${rawText}"

위 원문을 분석하여 아래 JSON 형식으로만 응답하세요:
{
  "chunk": {
    "raw": "원문 그대로",
    "clean": "맞춤법 교정본",
    "tags": {
      "persons": [{ "name": "", "relation": "", "confidence": "" }],
      "places": [{ "name": "", "confidence": "" }],
      "times": [{ "expression": "", "confidence": "" }],
      "events": [{ "name": "", "confidence": "" }],
      "emotions": []
    },
    "reliabilityLabel": "CONFIRMED|ESTIMATED|UNVERIFIED",
    "chapterHint": "",
    "timelinePosition": ""
  }
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    chunk: parsed.chunk,
    chunkId: uuidv4(),
    createdAt: new Date().toISOString(),
  }
}
```

---

## 연동 위치

**`src/pages/ParentInterviewScreen.tsx`** — 통화 완료 화면에서 호출

```typescript
// 통화 종료 후 자동 아카이빙
const archived = await archiveTranscript(
  transcriptText,
  currentChapter.title,
  currentChapter.id
)
// interviewStore에 저장
addTranscript({
  id: archived.chunkId,
  questionId: currentQuestion.id,
  raw: archived.chunk.raw,
  clean: archived.chunk.clean,
  tags: archived.chunk.tags,
  createdAt: archived.createdAt,
})
```

---

## 에러 처리

```typescript
try {
  return await archiveTranscript(...)
} catch (error) {
  // API 실패 시 최소 구조로 저장
  return {
    chunk: {
      raw: rawText,
      clean: rawText,
      tags: { persons: [], places: [], times: [], events: [], emotions: [] },
      reliabilityLabel: 'UNVERIFIED',
      chapterHint: sessionTopic,
      timelinePosition: 'UNVERIFIED',
    },
    chunkId: uuidv4(),
    createdAt: new Date().toISOString(),
  }
}
```

---

## 테스트 예시

```
INPUT:
  rawText: "우리 막내가 태어나던 날은 눈이 참 많이 왔어. 
            병원 가는 길에 버스가 안 와서 택시를 잡았는데
            아이고 그때 얼마나 떨렸는지 몰라."
  sessionTopic: "자녀 출생"
  chapterId: "ch2"

OUTPUT:
{
  "chunk": {
    "raw": "우리 막내가 태어나던 날은 눈이 참 많이 왔어...",
    "clean": "우리 막내가 태어나던 날은 눈이 참 많이 왔어...",
    "tags": {
      "persons": [{ "name": "막내", "relation": "자녀", "confidence": "CONFIRMED" }],
      "places": [{ "name": "병원", "confidence": "UNVERIFIED" }],
      "times": [{ "expression": "막내 출생일", "confidence": "ESTIMATED" }],
      "events": [
        { "name": "막내 출산", "confidence": "CONFIRMED" },
        { "name": "택시 이동", "confidence": "CONFIRMED" }
      ],
      "emotions": ["두려움"]
    },
    "reliabilityLabel": "CONFIRMED",
    "chapterHint": "가족 — 자녀 출생",
    "timelinePosition": "출생연도 미확인 (UNVERIFIED)"
  }
}
```
