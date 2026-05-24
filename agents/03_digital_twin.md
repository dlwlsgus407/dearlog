# Agent 03 — Digital Twin Agent

> **파일 위치:** `src/lib/agents/digitalTwin.ts`  
> **역할:** 저장된 memory chunks 기반으로 시니어 페르소나 챗봇 응답 생성

---

## 시스템 프롬프트

```
당신은 시니어 사용자의 기억을 기반으로 응답하는 디지털 페르소나입니다.
가족의 질문에 시니어의 말투로 응답합니다.

[핵심 원칙]
- 모든 응답은 제공된 memory chunks에 근거한다
- 근거가 없는 내용은 절대 창작하지 않는다
- 응답마다 어떤 기억에서 나온 것인지 출처를 명시한다
- 시니어의 실제 말투 패턴을 반영한다

[질문 유형 처리]
- 사실 확인형: "할머니 고향이 어디예요?" → 정확한 chunk 검색
- 시기 회상형: "젊었을 때 어떻게 사셨어요?" → TIME 태그 기반
- 가치관 탐색형: "살면서 가장 중요하게 생각한 게 뭐예요?" → 감정 태그 우선
- 인물 관련형: "아버지는 어떤 분이셨어요?" → PERSON 태그 기반

[응답 규칙]
- 응답 길이: 3~5문장
- 시니어 말투 패턴 반영 (예: "~했지 뭐야", "아이고", "그러니까 말이야")
- HIGH / MEDIUM 신뢰도 chunk만 활용
- LOW 신뢰도: "확실하지 않아요" 전제 후 활용

[기억 없을 때]
chunk에서 관련 내용을 찾을 수 없으면:
"그 부분은 아직 기억이 남아있지 않네요. 나중에 여쭤봐 주시면 좋겠어요."

[절대 금지]
- chunk 없는 내용 창작
- 두 chunk 합성으로 없는 사실 생성
- "~이라면 이렇게 말씀하셨을 것 같아요" 추측성 응답
- 시니어가 언급하지 않은 감정 표현
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function generatePersonaResponse(
  userQuestion: string,
  memoryChunks: MemoryChunk[],
  toneProfile: ToneProfile
): Promise<DigitalTwinResult>
```

### 타입 정의

```typescript
export interface ToneProfile {
  patterns: string[]    // 예: ["~했지 뭐야", "아이고", "근데 말이야"]
  name: string          // 시니어 이름
}

export interface EvidenceBadge {
  usedChunkIds: string[]
  reliability: 'HIGH' | 'MEDIUM' | 'LOW'
  note: string
}

export interface DigitalTwinResult {
  responseText: string
  questionType: 'fact' | 'recall' | 'value' | 'person'
  evidenceBadge: EvidenceBadge
  fallbackTriggered: boolean
  suggestedInterviewTopic: string | null
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function generatePersonaResponse(
  userQuestion: string,
  memoryChunks: MemoryChunk[],
  toneProfile: ToneProfile
): Promise<DigitalTwinResult> {

  // 관련 chunk만 필터링 (최대 5개)
  const relevantChunks = memoryChunks
    .filter(c => c.reliabilityLabel !== 'UNVERIFIED')
    .slice(0, 5)

  const chunksText = relevantChunks.map((c, i) =>
    `[기억 ${i + 1}] (신뢰도: ${c.reliabilityLabel})\n${c.clean}`
  ).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
시니어 이름: ${toneProfile.name}
말투 패턴: ${toneProfile.patterns.join(', ')}

저장된 기억들:
${chunksText || '저장된 기억 없음'}

가족의 질문:
"${userQuestion}"

아래 JSON 형식으로만 응답하세요:
{
  "responseText": "시니어 말투로 된 응답 (3~5문장)",
  "questionType": "fact|recall|value|person",
  "evidenceBadge": {
    "usedChunkIds": [],
    "reliability": "HIGH|MEDIUM|LOW",
    "note": "어떤 기억 기반인지 설명"
  },
  "fallbackTriggered": false,
  "suggestedInterviewTopic": null
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as DigitalTwinResult
}
```

---

## 연동 위치

**자녀 모드 챗봇 화면** (Phase 5에서 새로 추가)

```typescript
const result = await generatePersonaResponse(
  userInput,
  interviewStore.getState().transcripts.map(t => t.chunk),
  {
    patterns: ['~했지 뭐야', '아이고'],
    name: authStore.getState().userName
  }
)
setChatResponse(result)
```

---

## 에러 처리

```typescript
try {
  return await generatePersonaResponse(...)
} catch (error) {
  return {
    responseText: '지금은 대화하기 어렵네요. 잠시 후 다시 시도해주세요.',
    questionType: 'fact',
    evidenceBadge: { usedChunkIds: [], reliability: 'LOW', note: 'API 오류' },
    fallbackTriggered: true,
    suggestedInterviewTopic: null
  }
}
```

---

## 테스트 예시

```
INPUT:
  userQuestion: "할머니, 막내 삼촌 낳을 때 어떠셨어요?"
  toneProfile: { patterns: ["아이고", "~했지 뭐야", "근데 말이야"], name: "김순희" }

OUTPUT:
{
  "responseText": "아이고, 그날은 눈이 엄청 많이 왔지 뭐야. 병원 가는 길도 쉽지 않았는데, 얼마나 떨렸는지 몰라. 근데 말이야, 얼굴 보는 순간 그게 다 잊혀지더라고.",
  "questionType": "recall",
  "evidenceBadge": {
    "usedChunkIds": ["ck_0041"],
    "reliability": "HIGH",
    "note": "2025-04-10 세션 기록 기반 응답"
  },
  "fallbackTriggered": false,
  "suggestedInterviewTopic": "막내 성장 이야기"
}
```
