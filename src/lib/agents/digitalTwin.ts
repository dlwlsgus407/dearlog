import OpenAI from 'openai'
import { isDemoMode } from './config'
import type { MemoryChunk, ToneProfile, DigitalTwinResult } from '../../types/agents'

const SYSTEM_PROMPT = `당신은 시니어의 디지털 페르소나입니다.
제공된 memory chunks만을 근거로 시니어의 말투로 응답합니다.

질문 유형:
- fact: 사실 확인 ("언제", "어디서", "누가")
- recall: 기억 회상 ("어떠셨나요", "기억하시나요")
- value: 가치관/교훈 ("어떻게 생각하세요", "무엇이 중요한가요")
- person: 인물 관련 ("~는 어떤 사람이었나요")

기억이 없을 때:
"그 부분은 아직 기억이 남아있지 않네요... 언젠가 이야기해 드릴게요."

절대 금지:
- memory chunk에 없는 내용 창작
- 추측성 응답 ("~이었을 것 같아요")

반드시 JSON 형식으로만 응답하세요:
{
  "responseText": "시니어 말투 응답",
  "questionType": "recall",
  "evidenceBadge": {
    "usedChunkIds": [],
    "reliability": "CONFIRMED",
    "note": "근거 설명"
  },
  "fallbackTriggered": false,
  "suggestedInterviewTopic": "추가 주제 (없으면 생략)"
}`

const DEMO_RESULT: DigitalTwinResult = {
  responseText: '아이고, 그때 생각이 나네요. 참 소중한 기억이에요.',
  questionType: 'recall',
  evidenceBadge: { usedChunkIds: [], reliability: 'CONFIRMED', note: '데모 응답' },
  fallbackTriggered: false,
}

export async function generatePersonaResponse(
  userQuestion: string,
  memoryChunks: Array<MemoryChunk & { chunkId: string }>,
  toneProfile: ToneProfile
): Promise<DigitalTwinResult> {
  if (isDemoMode()) return DEMO_RESULT

  try {
    const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    const validChunks = memoryChunks.filter((c) => c.reliabilityLabel !== 'UNVERIFIED').slice(-5)
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `말투 프로필: ${JSON.stringify(toneProfile)}\n\n기억 chunks:\n${JSON.stringify(validChunks, null, 2)}\n\n질문: ${userQuestion}`,
        },
      ],
    })
    const content = response.choices[0].message.content
    if (!content) throw new Error('Empty response')
    return JSON.parse(content) as DigitalTwinResult
  } catch {
    return {
      responseText: '지금은 말씀드리기 어렵네요. 나중에 다시 여쭤봐 주세요.',
      questionType: 'recall',
      evidenceBadge: { usedChunkIds: [], reliability: 'UNVERIFIED', note: '오류로 인한 fallback' },
      fallbackTriggered: true,
    }
  }
}
