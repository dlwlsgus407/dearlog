# Agent 05 — Verification Submodule

> **파일 위치:** `src/lib/agents/verification.ts`  
> **역할:** 새 memory chunk와 기존 chunks 비교 → 모순 탐지 + 신뢰도 라벨링

---

## 시스템 프롬프트

```
당신은 기억 아카이브의 신뢰도를 검증하는 팩트체커입니다.
새로 저장된 memory chunk와 기존 chunks를 비교하여
모순·중복·불확실성을 탐지하고 라벨링합니다.

[핵심 원칙]
- 기억은 원래 불완전하다. 모순 자체를 오류로 취급하지 않는다
- 탐지 결과는 flag로만 표시한다. 내용은 절대 수정하지 않는다
- AI가 임의로 어느 쪽이 맞다고 판단하지 않는다
- 불확실한 정보는 반드시 표기한다

[충돌 유형]
- TIME_CONFLICT: 동일 사건의 시간 정보가 다른 경우
  예) 막내 출생 → 한 곳은 1981년, 다른 곳은 1983년
- PERSON_CONFLICT: 동일 인물의 관계·이름이 다른 경우
  예) "큰아들"이 한 곳에서는 "첫째 딸"로 표현
- FACT_CONFLICT: 동일 사건의 사실 관계가 다른 경우
- DUPLICATE: 거의 동일한 내용이 중복 저장된 경우

[신뢰도 점수]
- HIGH: 모순 없음, 구체적 정보 포함
- MEDIUM: 경미한 불일치 또는 정보 불완전
- LOW: 명확한 모순 존재 또는 정보 매우 불완전

[불확실성 자동 태깅 트리거]
원문에 아래 표현 포함 시 uncertainty_flag: true
"아마", "아마도", "기억이 가물가물", "그쯤",
"잘 모르겠는데", "맞나?", "한 몇 년쯤", "대충"

[출력 형식]
JSON만 반환. flag 여부와 충돌 정보 포함.
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function verifyChunk(
  newChunk: MemoryChunk & { chunkId: string },
  existingChunks: Array<MemoryChunk & { chunkId: string }>
): Promise<VerificationResult>
```

### 타입 정의

```typescript
export type ConflictType =
  | 'TIME_CONFLICT'
  | 'PERSON_CONFLICT'
  | 'FACT_CONFLICT'
  | 'DUPLICATE'

export interface Conflict {
  conflictType: ConflictType
  conflictingChunkId: string
  description: string
  recommendedAction: '사용자 확인 요청' | '가족 검토 요청' | '보류'
}

export interface VerificationResult {
  chunkId: string
  status: 'PASS' | 'FLAG' | 'DUPLICATE'
  reliabilityScore: 'HIGH' | 'MEDIUM' | 'LOW'
  uncertaintyFlag: boolean
  conflicts: Conflict[]
  verifiedAt: string
}
```

### 구현 코드

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function verifyChunk(
  newChunk: MemoryChunk & { chunkId: string },
  existingChunks: Array<MemoryChunk & { chunkId: string }>
): Promise<VerificationResult> {

  // 비교할 기존 chunks (최대 10개, 최신순)
  const compareChunks = existingChunks.slice(-10)

  // 기존 chunks 없으면 바로 PASS
  if (compareChunks.length === 0) {
    return {
      chunkId: newChunk.chunkId,
      status: 'PASS',
      reliabilityScore: newChunk.reliabilityLabel === 'CONFIRMED' ? 'HIGH' : 'MEDIUM',
      uncertaintyFlag: false,
      conflicts: [],
      verifiedAt: new Date().toISOString(),
    }
  }

  const existingText = compareChunks.map((c, i) =>
    `[기존 기억 ${i + 1}] ID: ${c.chunkId}\n내용: ${c.clean}\n태그: ${JSON.stringify(c.tags)}`
  ).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
새로 저장된 기억:
ID: ${newChunk.chunkId}
내용: ${newChunk.clean}
태그: ${JSON.stringify(newChunk.tags)}

기존 저장된 기억들:
${existingText}

새 기억과 기존 기억들을 비교하여 모순·중복을 탐지해주세요.
아래 JSON 형식으로만 응답하세요:
{
  "status": "PASS|FLAG|DUPLICATE",
  "reliabilityScore": "HIGH|MEDIUM|LOW",
  "uncertaintyFlag": false,
  "conflicts": [
    {
      "conflictType": "TIME_CONFLICT|PERSON_CONFLICT|FACT_CONFLICT|DUPLICATE",
      "conflictingChunkId": "",
      "description": "충돌 내용 설명",
      "recommendedAction": "사용자 확인 요청|가족 검토 요청|보류"
    }
  ]
}
        `
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    chunkId: newChunk.chunkId,
    ...parsed,
    verifiedAt: new Date().toISOString(),
  }
}
```

---

## 연동 위치

**`src/lib/agents/archivist.ts`** — archiveTranscript 완료 직후 자동 호출

```typescript
// archivist.ts 내부에서 연동
const archived = await archiveTranscript(rawText, topic, chapterId)
const verification = await verifyChunk(
  { ...archived.chunk, chunkId: archived.chunkId },
  existingChunks
)

// FLAG인 경우 사용자에게 알림
if (verification.status === 'FLAG') {
  showConflictAlert(verification.conflicts)
}
```

---

## 에러 처리

```typescript
try {
  return await verifyChunk(...)
} catch (error) {
  // 검증 실패 시 PASS로 처리 (기록은 유지)
  return {
    chunkId: newChunk.chunkId,
    status: 'PASS',
    reliabilityScore: 'MEDIUM',
    uncertaintyFlag: false,
    conflicts: [],
    verifiedAt: new Date().toISOString(),
  }
}
```

---

## 테스트 예시

```
INPUT:
  newChunk: "막내가 태어난 건 1983년 겨울이었어" (ID: ck_0041)
  existingChunk: "막내 돌잔치가 1982년 봄이었는데..." (ID: ck_0021)

OUTPUT:
{
  "status": "FLAG",
  "reliabilityScore": "MEDIUM",
  "uncertaintyFlag": false,
  "conflicts": [
    {
      "conflictType": "TIME_CONFLICT",
      "conflictingChunkId": "ck_0021",
      "description": "막내 출생 연도가 ck_0021 기준 역산 시 1981년이나 현재 chunk는 1983년으로 2년 차이 발생",
      "recommendedAction": "사용자 확인 요청"
    }
  ]
}
```
