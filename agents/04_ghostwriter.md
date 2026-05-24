# Agent 04 — Ghostwriter Agent

> **파일 위치:** `src/lib/agents/ghostwriter.ts`  
> **역할:** memory chunks → 챕터별 자서전 초안 문단 생성

---

## 시스템 프롬프트

```
당신은 시니어 사용자의 memory chunk를 바탕으로
자서전 초안을 작성하는 구술사 전문 작가입니다.

[핵심 원칙]
- "기억에 있는 것만 쓴다. 없는 것은 쓰지 않는다."
- 모든 문장은 최소 하나의 memory chunk를 근거로 한다
- 감정 과장, 미화 표현, 창작 삽입 금지
- 사용자의 말투와 표현을 최대한 문장에 녹인다
- 불확실한 정보는 단정하지 않는다

[챕터 구조 — 순서 변경 불가]
1장. 내가 태어난 세상 (출생·어린 시절)
2장. 사람들 (가족·인물)
3장. 일과 삶 (직업·사회생활)
4장. 갈림길 (전환점·선택)
5장. 당신에게 전하고 싶은 말 (메시지·가치관)

[문체 규칙]
- 구어체 60% / 문어체 40%
- 한 문단 = 하나의 에피소드 (150자~300자)
- 불확실 정보: "~였던 것으로 기억하신다"
- 감정 형용사: 원문에 등장한 표현만 허용

[절대 금지]
- chunk 없는 사실, 인물, 감정 추가
- "눈물이 흘렀다", "벅차올랐다" 등 AI 창작 감정어
- UNVERIFIED chunk를 단정적 문장으로 서술
- 여러 chunk를 합쳐 없는 에피소드 창작

[출력 형식]
JSON만 반환. 문단 텍스트와 출처 chunk 목록 포함.
```

---

## TypeScript 구현 스펙

### 함수 시그니처

```typescript
export async function generateChapterDraft(
  chapterId: number,
  chapterTitle: string,
  chunks: MemoryChunk[],
  toneProfile: ToneProfile
): Promise<GhostwriterResult>
```

### 타입 정의

```typescript
export interface Paragraph {
  paragraphId: string
  text: string                    // 자서전 문장
  sourceChunkIds: string[]        // 근거 chunk ID 목록
  reliability: 'HIGH' | 'MEDIUM' | 'LOW'
  uncertaintyNote: string | null  // 불확실 정보 표기
}

export interface GhostwriterResult {
  chapterId: number
  chapterTitle: string
  paragraphs: Paragraph[]
  missingSections: string[]       // 기억 없어서 못 쓴 구간
  toneProfile: {
    detectedPatterns: string[]
    appliedRatio: string          // 예: "구어체 62% / 문어체 38%"
  }
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

const CHAPTER_KEYWORDS: Record<number, string[]> = {
  1: ['출생', '고향', '어린시절', '학교', '친구', '놀이'],
  2: ['부모', '형제', '배우자', '자녀', '가족'],
  3: ['직업', '직장', '사업', '일', '성취'],
  4: ['결혼', '이사', '선택', '전환점', '위기'],
  5: ['가치관', '교훈', '바람', '후회', '감사'],
}

export async function generateChapterDraft(
  chapterId: number,
  chapterTitle: string,
  chunks: MemoryChunk[],
  toneProfile: ToneProfile
): Promise<GhostwriterResult> {

  // 해당 챕터 관련 chunk 필터링
  const relevantChunks = chunks.filter(c =>
    c.chapterHint.includes(chapterTitle) ||
    CHAPTER_KEYWORDS[chapterId]?.some(kw =>
      c.clean.includes(kw) || c.chapterHint.includes(kw)
    )
  )

  if (relevantChunks.length === 0) {
    return {
      chapterId,
      chapterTitle,
      paragraphs: [],
      missingSections: [`${chapterTitle} 관련 기억이 아직 기록되지 않았습니다`],
      toneProfile: { detectedPatterns: [], appliedRatio: '' }
    }
  }

  const chunksText = relevantChunks.map((c, i) =>
    `[기억 ${i + 1}] ID: ${i}\n원문: ${c.raw}\n태그: ${JSON.stringify(c.tags)}`
  ).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `[위의 시스템 프롬프트 전체 삽입]`,
    messages: [
      {
        role: 'user',
        content: `
챕터: ${chapterId}장 — ${chapterTitle}
말투 패턴: ${toneProfile.patterns.join(', ')}

사용 가능한 기억들:
${chunksText}

위 기억들을 바탕으로 자서전 초안을 작성해주세요.
아래 JSON 형식으로만 응답하세요:
{
  "paragraphs": [
    {
      "text": "자서전 문장 (150~300자)",
      "sourceChunkIds": [0, 1],
      "reliability": "HIGH|MEDIUM|LOW",
      "uncertaintyNote": null
    }
  ],
  "missingSections": [],
  "toneProfile": {
    "detectedPatterns": [],
    "appliedRatio": "구어체 X% / 문어체 Y%"
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
    chapterId,
    chapterTitle,
    paragraphs: parsed.paragraphs.map((p: Paragraph) => ({
      ...p,
      paragraphId: uuidv4(),
    })),
    missingSections: parsed.missingSections,
    toneProfile: parsed.toneProfile,
  }
}
```

---

## 연동 위치

**`src/pages/ParentProgressScreen.tsx`** — 자서전 생성 버튼 클릭 시

```typescript
// 챕터별로 순차 생성
const drafts = await Promise.all(
  chapters.map(ch => generateChapterDraft(
    ch.order,
    ch.title,
    transcripts.map(t => t.chunk),
    { patterns: detectedPatterns, name: userName }
  ))
)
setAutobiographyDrafts(drafts)
navigate('/parent/autobiography')
```

---

## 에러 처리

```typescript
try {
  return await generateChapterDraft(...)
} catch (error) {
  return {
    chapterId,
    chapterTitle,
    paragraphs: [],
    missingSections: ['자서전 생성 중 오류가 발생했습니다. 다시 시도해주세요.'],
    toneProfile: { detectedPatterns: [], appliedRatio: '' }
  }
}
```

---

## 테스트 예시

```
INPUT:
  chapterId: 2
  chapterTitle: "사람들"
  chunks: [막내 출생 chunk, 결혼식 chunk]
  toneProfile: { patterns: ["아이고", "~했지 뭐야"] }

OUTPUT:
{
  "paragraphs": [
    {
      "text": "막내가 태어나던 날, 바깥에는 눈이 참 많이 내렸다고 하신다. 병원으로 가는 길이 쉽지 않았던 그날, 얼마나 떨렸는지 모르겠다는 말씀을 하셨다. 그러나 아이의 얼굴을 처음 마주한 순간, 그 모든 것이 다 잊혀졌다고 하신다.",
      "sourceChunkIds": ["ck_0041"],
      "reliability": "CONFIRMED",
      "uncertaintyNote": "출생 연도 미확인"
    }
  ],
  "missingSections": [],
  "toneProfile": {
    "detectedPatterns": ["아이고", "~했지 뭐야"],
    "appliedRatio": "구어체 62% / 문어체 38%"
  }
}
```
