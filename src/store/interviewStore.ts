import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chapter, Transcript } from '../types/interview'

const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    title: '어린 시절',
    description: '태어나서 청소년기까지의 기억',
    order: 1,
    questions: [
      { id: 'q1', text: '어린 시절 가장 기억에 남는 장소는 어디인가요?', chapterId: 'ch1', completed: true, answeredAt: '2026-05-18' },
      { id: 'q2', text: '어머니, 아버지는 어떤 분이셨나요?', chapterId: 'ch1', completed: true, answeredAt: '2026-05-19' },
      { id: 'q3', text: '형제자매와의 추억 중 가장 소중한 것은?', chapterId: 'ch1', completed: true, answeredAt: '2026-05-20' },
      { id: 'q4', text: '어린 시절 좋아했던 놀이나 취미는 무엇인가요?', chapterId: 'ch1', completed: false },
      { id: 'q5', text: '초등학교 시절 선생님 중 기억에 남는 분이 계신가요?', chapterId: 'ch1', completed: false },
    ],
  },
  {
    id: 'ch2',
    title: '청년 시절',
    description: '20~30대 사회에 첫 발을 내딛던 시절',
    order: 2,
    questions: [
      { id: 'q6', text: '처음 일을 시작했을 때 어떤 마음이었나요?', chapterId: 'ch2', completed: true, answeredAt: '2026-05-21' },
      { id: 'q7', text: '20대에 가장 힘들었던 순간은 언제였나요?', chapterId: 'ch2', completed: false },
      { id: 'q8', text: '청년 시절 꿈은 무엇이었나요?', chapterId: 'ch2', completed: false },
      { id: 'q9', text: '첫 월급으로 무엇을 하셨나요?', chapterId: 'ch2', completed: false },
    ],
  },
  {
    id: 'ch3',
    title: '가족 이야기',
    description: '사랑하는 가족과 함께한 소중한 순간들',
    order: 3,
    questions: [
      { id: 'q10', text: '배우자를 처음 만났을 때를 기억하시나요?', chapterId: 'ch3', completed: false },
      { id: 'q11', text: '자녀들이 태어났을 때 어떤 마음이었나요?', chapterId: 'ch3', completed: false },
      { id: 'q12', text: '가족과 함께한 최고의 여행이나 추억은?', chapterId: 'ch3', completed: false },
      { id: 'q13', text: '부모님께 전하고 싶은 말이 있다면?', chapterId: 'ch3', completed: false },
    ],
  },
  {
    id: 'ch4',
    title: '인생의 지혜',
    description: '세월이 담긴 삶의 이야기와 조언',
    order: 4,
    questions: [
      { id: 'q14', text: '살면서 가장 중요하게 생각하는 가치는 무엇인가요?', chapterId: 'ch4', completed: false },
      { id: 'q15', text: '젊은 세대에게 전하고 싶은 조언이 있다면?', chapterId: 'ch4', completed: false },
      { id: 'q16', text: '인생을 다시 산다면 무엇을 다르게 하고 싶으신가요?', chapterId: 'ch4', completed: false },
    ],
  },
]

const INITIAL_TRANSCRIPTS: Transcript[] = [
  {
    id: 't1',
    questionId: 'q1',
    questionText: '어린 시절 가장 기억에 남는 장소는 어디인가요?',
    chapterId: 'ch1',
    chapterTitle: '어린 시절',
    originalText:
      '음... 그게 말이지, 우리 집 뒷산이 있었는데. 거기서 동네 아이들이랑 매일같이 놀았어. 봄에는 진달래도 따먹고, 여름에는 매미도 잡고. 그 산 이름이... 뭐였더라, 하여튼 조그마한 산이었는데 우리한테는 세상 전부 같았지. 지금도 그 냄새가 생각나. 흙냄새, 풀냄새.',
    aiSummary:
      '어린 시절 집 뒤편의 작은 산이 가장 인상 깊은 장소로 기억됩니다. 동네 아이들과 함께 사계절을 즐기며 뛰어놀던 곳으로, 봄에는 진달래를 따먹고 여름에는 매미를 잡는 등 자연과 함께한 추억이 깃들어 있습니다. 어린 시절 그 작은 산은 온 세상과도 같은 소중한 공간이었습니다.',
    recordedAt: '2026-05-18',
  },
  {
    id: 't2',
    questionId: 'q2',
    questionText: '어머니, 아버지는 어떤 분이셨나요?',
    chapterId: 'ch1',
    chapterTitle: '어린 시절',
    originalText:
      '아버지는 좀 엄하셨어. 말씀을 많이 안 하시는 편이었는데, 그래도 속은 따뜻하셨지. 내가 학교에서 상 받아오면 아무 말씀 없이 그냥 고개를 끄덕이셨는데 그게 더 뿌듯했어. 어머니는... 항상 부엌에 계셨어. 새벽에 일어나서 밥하시고, 밤에 가장 늦게 주무셨고. 손이 참 거치셨는데 그 손이 그리워.',
    aiSummary:
      '아버지는 과묵하고 엄격하셨지만 속이 따뜻한 분이셨습니다. 성과에 대한 무언의 인정이 오히려 더 큰 격려가 되었다고 합니다. 어머니는 가족을 위해 새벽부터 밤늦게까지 헌신하신 분으로, 고된 노동으로 거칠어진 어머니의 손이 지금도 그립다고 회상합니다.',
    recordedAt: '2026-05-19',
  },
  {
    id: 't3',
    questionId: 'q3',
    questionText: '형제자매와의 추억 중 가장 소중한 것은?',
    chapterId: 'ch1',
    chapterTitle: '어린 시절',
    originalText:
      '남동생이 하나 있었는데. 걔가 나보다 네 살 어렸거든. 장마 때 비가 많이 와서 개울이 불어나면 우리 둘이 몰래 나가서 가재도 잡고 그랬어. 엄마한테 혼날 게 뻔한데도 그게 그렇게 재밌었지. 어른이 되고 나서는 바빠서 자주 못 봤는데... 그래도 어릴 때 같이 논 게 제일 행복한 기억이야.',
    aiSummary:
      '네 살 아래 남동생과 함께한 어린 시절 추억이 가장 소중한 기억으로 남아 있습니다. 장마철 불어난 개울에서 함께 가재를 잡던 일은 혼날 것을 알면서도 감행할 만큼 즐거운 모험이었습니다. 성인이 된 후 서로 바빠 자주 만나지 못했지만, 어린 시절 함께 뛰어놀던 그 시간이 삶에서 가장 행복한 기억으로 자리하고 있습니다.',
    recordedAt: '2026-05-20',
  },
  {
    id: 't4',
    questionId: 'q6',
    questionText: '처음 일을 시작했을 때 어떤 마음이었나요?',
    chapterId: 'ch2',
    chapterTitle: '청년 시절',
    originalText:
      '스물 셋에 첫 직장을 구했는데. 작은 회사였어. 공장 같은 데였는데 그래도 내 힘으로 돈 버는 게 그렇게 뿌듯할 수가 없었어. 첫 월급 받는 날 어머니한테 봉투째로 드렸지. 어머니가 그걸 받으시면서 우셨어. 나도 울었고. 그 장면이 아직도 선명하게 기억나.',
    aiSummary:
      '스물셋에 작은 공장에서 첫 사회생활을 시작하셨습니다. 규모와 무관하게 스스로 번 첫 수입에서 큰 보람을 느끼셨으며, 첫 월급을 봉투째 어머니께 드린 날 두 분이 함께 눈물을 흘렸던 순간이 지금도 선명하게 기억에 남아 있습니다.',
    recordedAt: '2026-05-21',
  },
]

interface InterviewState {
  chapters: Chapter[]
  transcripts: Transcript[]
  markQuestionCompleted: (questionId: string, rawText?: string) => void
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      chapters: INITIAL_CHAPTERS,
      transcripts: INITIAL_TRANSCRIPTS,
      markQuestionCompleted: (questionId, rawText) =>
        set((state) => {
          let questionText = ''
          let chapterId = ''
          let chapterTitle = ''
          for (const ch of state.chapters) {
            const q = ch.questions.find((q) => q.id === questionId)
            if (q) {
              questionText = q.text
              chapterId = ch.id
              chapterTitle = ch.title
              break
            }
          }

          const chapters = state.chapters.map((ch) => ({
            ...ch,
            questions: ch.questions.map((q) =>
              q.id === questionId
                ? { ...q, completed: true, answeredAt: new Date().toISOString().split('T')[0] }
                : q
            ),
          }))

          const originalText = rawText ||
            '(데모 녹음) 녹음된 음성이 여기에 표시됩니다. 실제 앱에서는 음성 인식된 원문이 한 글자도 수정 없이 그대로 보존됩니다.'

          const newTranscript: Transcript = {
            id: `t_${Date.now()}`,
            questionId,
            questionText,
            chapterId,
            chapterTitle,
            originalText,
            aiSummary:
              '(데모 정리) AI가 정리한 내용이 여기에 표시됩니다. 말씀하신 내용의 핵심을 유지하면서 읽기 좋은 형태로 구조화합니다.',
            recordedAt: new Date().toISOString().split('T')[0],
          }

          return { chapters, transcripts: [...state.transcripts, newTranscript] }
        }),
    }),
    { name: 'dearlog-interview' }
  )
)
