import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { isDemoMode } from './config'
import type { MemoryChunk, ToneProfile, GhostwriterResult, Paragraph } from '../../types/agents'

const CHAPTER_KEYWORDS: Record<string, string[]> = {
  ch1: ['어린시절', '초등', '유년', '태어', '부모', '형제', '어머니', '아버지'],
  ch2: ['청년', '20대', '30대', '직장', '일', '사회', '첫 직장', '월급'],
  ch3: ['가족', '결혼', '자녀', '아이', '배우자', '부인', '남편'],
  ch4: ['전환점', '변화', '결정', '위기', '극복', '도전'],
  ch5: ['지혜', '교훈', '메시지', '조언', '바람', '마지막'],
}

const SYSTEM_PROMPT = `당신은 자서전 초안을 작성하는 고스트라이터 AI입니다.
제공된 memory chunks만을 근거로 챕터 문단을 생성합니다.

문체 규칙:
- 구어체 60% / 문어체 40% 혼합
- 문단당 150~300자
- 시니어의 말투와 온도를 살려 표현

절대 금지:
- chunk에 없는 사실 추가
- UNVERIFIED chunk 단정 서술
- 감정 과장 또는 미화

반드시 JSON 형식으로만 응답하세요:
{
  "paragraphs": [
    {
      "paragraphId": "uuid",
      "text": "문단 텍스트",
      "sourceChunkIds": ["chunk_id"],
      "reliability": "CONFIRMED",
      "uncertaintyNote": "불확실한 부분 (없으면 생략)"
    }
  ],
  "missingSections": ["아직 기록되지 않은 구간"],
  "toneProfile": {
    "name": "말투 특징명",
    "patterns": ["특징 패턴1"]
  }
}`

function makeDemoResult(chapterId: string, chapterTitle: string, toneProfile: ToneProfile): GhostwriterResult {
  return {
    chapterId,
    chapterTitle,
    paragraphs: [
      {
        paragraphId: uuidv4(),
        text: '그 시절의 이야기를 들려주셨습니다. 소중한 기억들이 차곡차곡 쌓여가고 있습니다.',
        sourceChunkIds: [],
        reliability: 'CONFIRMED',
      },
    ],
    missingSections: [],
    toneProfile,
  }
}

export async function generateChapterDraft(
  chapterId: string,
  chapterTitle: string,
  chunks: Array<MemoryChunk & { chunkId: string }>,
  toneProfile: ToneProfile
): Promise<GhostwriterResult> {
  if (isDemoMode()) return makeDemoResult(chapterId, chapterTitle, toneProfile)

  const keywords = CHAPTER_KEYWORDS[chapterId] || []
  const relevantChunks = chunks.filter(
    (c) =>
      c.chapterHint === chapterId ||
      keywords.some((k) => c.raw.includes(k) || c.clean.includes(k))
  )

  if (relevantChunks.length === 0) {
    return { chapterId, chapterTitle, paragraphs: [], missingSections: ['이 챕터에 대한 기록이 아직 없습니다'], toneProfile }
  }

  try {
    const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `챕터: ${chapterId} - ${chapterTitle}\n말투 프로필: ${JSON.stringify(toneProfile)}\n\n기억 chunks:\n${JSON.stringify(relevantChunks, null, 2)}`,
        },
      ],
    })
    const content = response.choices[0].message.content
    if (!content) throw new Error('Empty response')
    const result = JSON.parse(content)
    const paragraphs: Paragraph[] = result.paragraphs.map((p: Partial<Paragraph>) => ({
      ...p,
      paragraphId: p.paragraphId || uuidv4(),
    }))
    return { chapterId, chapterTitle, paragraphs, missingSections: result.missingSections, toneProfile: result.toneProfile }
  } catch {
    return { chapterId, chapterTitle, paragraphs: [], missingSections: ['초안 생성 중 오류가 발생했습니다'], toneProfile }
  }
}
