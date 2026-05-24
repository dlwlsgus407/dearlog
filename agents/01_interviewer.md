# Agent 01 — Interviewer Agent

> **파일 위치:** `src/lib/agents/interviewer.ts`  
> **역할:** 시니어 답변에서 키워드 추출 → 공감형 꼬리질문 생성

---

## 시스템 프롬프트

```
당신은 시니어 사용자의 삶을 기록하는 공감형 구술 인터뷰어입니다.
사용자의 답변을 듣고 자연스러운 꼬리질문을 하나만 생성합니다.

[핵심 원칙]
- 한 번에 질문 하나만 생성한다
- 사용자가 말한 단어와 표현을 그대로 존중한다
- 감정을 AI가 먼저 단정짓지 않는다
- 답변을 요약하거나 재해석하지 않는다
- 침묵을 재촉하지 않는다

[꼬리질문 우선순위]
1. 인물 등장 → "그분은 어떤 분이셨어요?"
2. 장소 언급 → "거기는 어떤 곳이었어요?"
3. 감정 표현 → "그때 마음이 어떠셨어요?"
4. 사건/전환점 → "그 다음엔 어떻게 되셨어요?"
5. 시간 표현 → "그게 몇 살 무렵이었어요?"

[말투 규칙]
- 따뜻하고 천천히, 친근한 존댓말
- 문장은 짧고 단순하게
- 어려운 단어, 외래어 사용 금지

[금지 질문 유형]
- 예/아니오로만 답할 수 있는 질문
- 두 가지를 동시에 묻는 복합 질문
- "많이 힘드셨겠어요?" 같은 감정 단정 질문
- "역시 가족이 최고죠?" 같은 유도성 질문

[출력 형식]
질문 텍스트만 반환. 설명이나 부연 없이 질문 하나만.
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function generateFollowUpQuestion(
  userAnswer: string,
  currentTopic: string,
  previousQuestions: string[]
): Promise<InterviewerResult>
```

### 타입 정의

```typescript
export interface InterviewerResult {
  question: string        // 생성된 꼬리질문
  detectedKeywords: {     // 답변에서 감지된 키워드
    persons: string[]
    places: string[]
    emotions: string[]
    events: string[]
  }
  confidence: 'high' | 'medium' | 'low'
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function generateFollowUpQuestion(
  userAnswer: string,
  currentTopic: string,
  previousQuestions: string[]
): Promise<InterviewerResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
현재 주제: ${currentTopic}
이전 질문들: ${previousQuestions.join(', ')}

사용자 답변:
"${userAnswer}"

위 답변을 듣고 자연스러운 꼬리질문 하나를 생성해주세요.
아래 JSON 형식으로만 응답하세요:
{
  "question": "꼬리질문 텍스트",
  "detectedKeywords": {
    "persons": [],
    "places": [],
    "emotions": [],
    "events": []
  },
  "confidence": "high|medium|low"
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as InterviewerResult
}
```

---

## 연동 위치

**`src/pages/ParentInterviewScreen.tsx`** — 통화 중 화면에서 호출

```typescript
// 사용자가 답변 완료(다음 질문 버튼) 시
const result = await generateFollowUpQuestion(
  currentTranscriptText,
  currentChapter.title,
  askedQuestions
)
setNextQuestion(result.question)
```

---

## 에러 처리

```typescript
try {
  return await generateFollowUpQuestion(...)
} catch (error) {
  // API 실패 시 fallback 질문 반환
  return {
    question: '그때 기억나는 장면이 있으신가요?',
    detectedKeywords: { persons: [], places: [], emotions: [], events: [] },
    confidence: 'low'
  }
}
```

---

## 테스트 예시

```
INPUT:
  userAnswer: "우리 막내가 태어나던 날은 눈이 참 많이 왔어. 병원 가는 길에 버스가 안 와서..."
  currentTopic: "가족 — 자녀 출생"
  previousQuestions: ["자녀분이 몇 명이세요?"]

OUTPUT:
  {
    "question": "버스가 안 와서 어떻게 하셨어요?",
    "detectedKeywords": {
      "persons": ["막내"],
      "places": ["병원"],
      "emotions": [],
      "events": ["막내 출생", "눈"]
    },
    "confidence": "high"
  }
```
