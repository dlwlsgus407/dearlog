# Agent 07 — Calendar Trigger Agent

> **파일 위치:** `src/lib/agents/calendarTrigger.ts`  
> **역할:** 캘린더 이벤트 감지 → 관련 기억 검색 → 자서전 형식 편집 or 인터뷰 세션 생성

---

## 시스템 프롬프트

```
당신은 캘린더 이벤트와 관련된 기억을 자서전 형식으로 편집하는 에이전트입니다.
이벤트 정보와 저장된 memory chunks를 바탕으로
가족에게 전달할 특별한 이야기를 만들어냅니다.

[핵심 원칙]
- 반드시 저장된 memory chunks에 근거한 내용만 작성한다
- 없는 내용은 절대 창작하지 않는다
- 이벤트와 관련 있는 기억만 선택한다
- 감정 과장, 미화 표현 금지

[지원 이벤트 유형]
- 결혼식: 배우자, 결혼, 웨딩, 혼례 관련 기억
- 졸업식: 학교, 졸업, 공부, 시험 관련 기억
- 생일: 출생, 어린시절, 성장 관련 기억
- 기념일: 결혼, 만남, 첫날 관련 기억
- 기일: 해당 인물 PERSON 태그 기억
- 입학: 학교, 입학, 설렘 관련 기억
- 출산: 자녀, 출산, 병원 관련 기억

[편집 형식]
- 도입부: 이벤트와 연결되는 한 문장
- 본문: 관련 기억 2~3개를 자연스럽게 연결
- 마무리: 현재 이벤트 주인공에게 전하는 한 문장
- 전체 길이: 200~400자

[기억 없을 때]
관련 memory chunk가 없으면:
빈 편집본 대신 관련 인터뷰 주제 목록만 반환한다.
절대 창작하지 않는다.

[출력 형식]
JSON만 반환.
기억 있음 → editedStory 포함
기억 없음 → editedStory null, suggestedInterviewTopics 포함
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function processCalendarTrigger(
  event: CalendarEvent,
  memoryChunks: Array<MemoryChunk & { chunkId: string }>
): Promise<CalendarTriggerResult>
```

### 타입 정의

```typescript
export type EventType =
  | '결혼식' | '졸업식' | '생일' | '기념일'
  | '기일' | '입학' | '출산'

export interface CalendarEvent {
  eventId: string
  eventType: EventType
  eventDate: string        // ISO 8601
  relatedPersons: string[] // 이벤트 관련 인물
  recipientId: string      // 전달받을 가족 구성원 ID
}

export interface EditedStory {
  text: string              // 자서전 형식 편집본
  sourceChunkIds: string[]  // 근거 chunk ID
  reliability: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface CalendarTriggerResult {
  eventId: string
  triggerType: 'DELIVERY' | 'INTERVIEW'
  editedStory: EditedStory | null     // 기억 있을 때
  suggestedInterviewTopics: string[]  // 기억 없을 때
  matchedChunkIds: string[]
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

// 이벤트 유형별 관련 키워드
const EVENT_KEYWORDS: Record<EventType, string[]> = {
  '결혼식': ['배우자', '결혼', '웨딩', '혼례', '부부'],
  '졸업식': ['학교', '졸업', '공부', '시험', '선생님'],
  '생일': ['출생', '태어', '어린시절', '성장', '아이'],
  '기념일': ['결혼', '만남', '처음', '첫날'],
  '기일': [],  // relatedPersons 기반으로 처리
  '입학': ['학교', '입학', '설렘', '시작'],
  '출산': ['자녀', '출산', '병원', '태어'],
}

export async function processCalendarTrigger(
  event: CalendarEvent,
  memoryChunks: Array<MemoryChunk & { chunkId: string }>
): Promise<CalendarTriggerResult> {

  // 관련 keywords 추출
  const keywords = [
    ...(EVENT_KEYWORDS[event.eventType] || []),
    ...event.relatedPersons,
  ]

  // 관련 chunks 필터링
  const relevantChunks = memoryChunks.filter(c =>
    keywords.some(kw =>
      c.clean.includes(kw) ||
      c.chapterHint.includes(kw) ||
      c.tags.persons.some(p => p.name.includes(kw)) ||
      c.tags.events.some(e => e.name.includes(kw))
    )
  )

  // 관련 기억 없으면 INTERVIEW 트리거
  if (relevantChunks.length === 0) {
    return {
      eventId: event.eventId,
      triggerType: 'INTERVIEW',
      editedStory: null,
      suggestedInterviewTopics: keywords.map(kw => `${kw} 관련 기억`),
      matchedChunkIds: [],
    }
  }

  const chunksText = relevantChunks.map((c, i) =>
    `[기억 ${i + 1}] ID: ${c.chunkId}\n${c.clean}`
  ).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 700,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
이벤트 정보:
- 유형: ${event.eventType}
- 날짜: ${event.eventDate}
- 관련 인물: ${event.relatedPersons.join(', ')}

관련된 기억들:
${chunksText}

위 기억들을 바탕으로 이벤트에 맞는 특별한 이야기를 편집해주세요.
아래 JSON 형식으로만 응답하세요:
{
  "triggerType": "DELIVERY",
  "editedStory": {
    "text": "자서전 형식 편집본 (200~400자)",
    "sourceChunkIds": ["chunk id 목록"],
    "reliability": "HIGH|MEDIUM|LOW"
  },
  "suggestedInterviewTopics": []
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    eventId: event.eventId,
    matchedChunkIds: relevantChunks.map(c => c.chunkId),
    ...parsed,
  }
}
```

---

## 연동 위치

**`src/hooks/useScheduledCall.ts`** — 기존 예약 전화 훅 확장

```typescript
// 이벤트 D-1일 감지 시
const result = await processCalendarTrigger(
  upcomingEvent,
  interviewStore.getState().transcripts.map(t => ({
    ...t.chunk,
    chunkId: t.id
  }))
)

if (result.triggerType === 'DELIVERY' && result.editedStory) {
  // 자서전 편집본 → 자녀에게 알림
  sendFamilyNotification({
    recipientId: event.recipientId,
    story: result.editedStory,
    eventType: event.eventType,
  })
} else {
  // 관련 기억 없음 → 인터뷰 세션 생성
  navigate('/parent/interview?type=family_question')
}
```

---

## 에러 처리

```typescript
try {
  return await processCalendarTrigger(...)
} catch (error) {
  // API 실패 시 INTERVIEW 트리거로 fallback
  return {
    eventId: event.eventId,
    triggerType: 'INTERVIEW',
    editedStory: null,
    suggestedInterviewTopics: [`${event.eventType} 관련 이야기`],
    matchedChunkIds: [],
  }
}
```

---

## 테스트 예시

```
INPUT:
  event: {
    eventType: "결혼식",
    eventDate: "2025-04-20",
    relatedPersons: ["딸", "수진"],
    recipientId: "child_001"
  }
  memoryChunks: [결혼식 관련 chunk 2개]

OUTPUT (기억 있음):
{
  "triggerType": "DELIVERY",
  "editedStory": {
    "text": "수진이가 결혼하는 날이 되었군요. 엄마도 그랬지요. 결혼식 날 아침, 하얀 드레스를 입고 거울 앞에 섰을 때 참 많이 떨렸어요. 그런데 아버지 손을 잡고 입장하는 순간, 그 떨림이 감사함으로 바뀌었지요. 수진이도 오늘 그런 순간을 느끼길 바랍니다.",
    "sourceChunkIds": ["ck_0055", "ck_0056"],
    "reliability": "HIGH"
  },
  "suggestedInterviewTopics": []
}

OUTPUT (기억 없음):
{
  "triggerType": "INTERVIEW",
  "editedStory": null,
  "suggestedInterviewTopics": [
    "결혼식 관련 기억",
    "배우자와의 첫 만남",
    "결혼 준비 이야기"
  ]
}
```
