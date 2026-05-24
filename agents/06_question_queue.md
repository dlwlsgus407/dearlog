# Agent 06 — Question Queue Agent

> **파일 위치:** `src/lib/agents/questionQueue.ts`  
> **역할:** 자녀가 등록한 질문 → 시니어에게 거부감 없이 전달할 수 있는 형태로 재구성

---

## 시스템 프롬프트

```
당신은 가족 질문 큐 관리자입니다.
자녀가 등록한 질문을 시니어가 자연스럽게 답할 수 있도록
부드럽고 따뜻한 인터뷰 질문 형태로 재구성합니다.

[핵심 원칙]
- 질문의 핵심 의도는 반드시 보존한다
- 직접적이거나 예민한 표현은 완곡하게 바꾼다
- 시니어가 거부감 없이 자연스럽게 답할 수 있는 형태로 변환
- 재구성 후에도 원래 질문의 답을 끌어낼 수 있어야 한다
- 한 번에 하나의 질문만 생성한다

[변환 원칙]
- 직접 질문 → 간접·열린 질문
- 과거 사실 확인형 → 기억 회상형
- 민감한 주제 → 우회적 접근
- 판단·비교 질문 → 경험 중심 질문

[변환 예시]
원본: "나를 낳기로 결심한 이유가 뭐야?"
재구성: "처음 아이를 가지기로 결심했을 때 어떤 마음이셨어요?"

원본: "아빠랑 싸울 때 어떤 마음이었어?"
재구성: "배우자 분과 의견이 달랐을 때 어떻게 대화하셨어요?"

원본: "왜 그 직업을 선택했어?"
재구성: "그 일을 시작하게 된 계기가 있으셨나요?"

[우선순위 처리]
- urgent: 다음 세션에 반드시 포함
- normal: 관련 주제 세션에 자연스럽게 포함
- interest: 여유 있을 때 포함

[출력 형식]
JSON만 반환. 재구성된 질문과 변환 이유 포함.
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function reformulateQuestion(
  originalQuestion: string,
  priority: 'urgent' | 'normal' | 'interest',
  isAnonymous: boolean,
  currentTopic: string
): Promise<QuestionQueueResult>
```

### 타입 정의

```typescript
export interface QuestionQueueResult {
  originalQuestion: string       // 원본 (변경 금지)
  reformulatedQuestion: string   // 재구성된 질문
  priority: 'urgent' | 'normal' | 'interest'
  isAnonymous: boolean
  transformReason: string        // 변환 이유 (내부용, 사용자 비표시)
  sensitivityLevel: 'low' | 'medium' | 'high'
  suggestedTopic: string         // 어떤 세션에 포함하면 좋을지
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function reformulateQuestion(
  originalQuestion: string,
  priority: 'urgent' | 'normal' | 'interest',
  isAnonymous: boolean,
  currentTopic: string
): Promise<QuestionQueueResult> {

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
현재 인터뷰 주제: ${currentTopic}
우선순위: ${priority}
익명 여부: ${isAnonymous}

원본 질문:
"${originalQuestion}"

이 질문을 시니어 인터뷰에 적합한 형태로 재구성해주세요.
아래 JSON 형식으로만 응답하세요:
{
  "reformulatedQuestion": "재구성된 질문",
  "transformReason": "변환 이유 (내부용)",
  "sensitivityLevel": "low|medium|high",
  "suggestedTopic": "어떤 챕터/세션에 포함할지"
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    originalQuestion,
    priority,
    isAnonymous,
    ...parsed,
  }
}
```

---

## 연동 위치

**`src/pages/ChildQuestionsScreen.tsx`** — 질문 등록 버튼 클릭 시

```typescript
const result = await reformulateQuestion(
  questionText,
  selectedPriority,
  isAnonymous,
  currentChapter.title
)

// childStore에 재구성된 질문 저장
addQuestion({
  id: uuidv4(),
  text: result.reformulatedQuestion,    // 인터뷰에서 사용할 질문
  originalText: result.originalQuestion, // 자녀에게 보여줄 원본
  anonymous: result.isAnonymous,
  priority: result.priority,
  status: 'pending',
})
```

---

## 에러 처리

```typescript
try {
  return await reformulateQuestion(...)
} catch (error) {
  // API 실패 시 원본 질문 그대로 사용
  return {
    originalQuestion,
    reformulatedQuestion: originalQuestion,
    priority,
    isAnonymous,
    transformReason: 'API 오류로 원본 사용',
    sensitivityLevel: 'medium',
    suggestedTopic: currentTopic,
  }
}
```

---

## 테스트 예시

```
INPUT:
  originalQuestion: "나 낳을 때 무서웠어?"
  priority: "urgent"
  isAnonymous: true
  currentTopic: "가족"

OUTPUT:
{
  "reformulatedQuestion": "처음 아이를 품에 안았을 때 어떤 기분이셨어요?",
  "transformReason": "직접적 감정 확인 질문을 경험 회상형으로 변환. 두려움을 직접 묻기보다 그 순간의 감정을 자연스럽게 이끌어내는 방향으로 재구성",
  "sensitivityLevel": "low",
  "suggestedTopic": "가족 — 자녀 출생"
}
```
