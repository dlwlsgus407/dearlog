import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChildQuestion, DemoPhoto, QuestionPriority } from '../types/child'

const INITIAL_QUESTIONS: ChildQuestion[] = [
  {
    id: 'cq1',
    text: '외할머니댁에서 형제들이랑 즐겨 하셨던 놀이가 있나요?',
    anonymous: true,
    priority: 'urgent',
    status: 'pending',
    submittedAt: '2026-05-20',
  },
  {
    id: 'cq2',
    text: '아버지를 처음 만나셨을 때 첫인상이 어떠셨어요?',
    anonymous: false,
    submittedBy: '지수',
    priority: 'normal',
    status: 'pending',
    submittedAt: '2026-05-21',
  },
  {
    id: 'cq3',
    text: '제가 어렸을 때 가장 귀여웠던 기억이 있으세요?',
    anonymous: false,
    submittedBy: '민준',
    priority: 'interest',
    status: 'answered',
    submittedAt: '2026-05-19',
  },
]

export const DEMO_PHOTO_TEMPLATES = [
  {
    caption: '1980년대 가족 나들이',
    generatedQuestions: [
      '이 나들이는 어디로 가셨나요?',
      '이 날 특별히 기억에 남는 일이 있었나요?',
      '사진 속 아이들은 몇 살이었나요?',
      '당시 가족 나들이는 얼마나 자주 가셨나요?',
    ],
  },
  {
    caption: '옛 집 앞마당',
    generatedQuestions: [
      '이 집은 언제부터 언제까지 사셨나요?',
      '이 마당에서 어떤 일들이 있었나요?',
      '이 집에서 가장 소중한 기억은 무엇인가요?',
      '이사를 하게 된 계기가 있나요?',
    ],
  },
  {
    caption: '결혼식 날',
    generatedQuestions: [
      '결혼식은 어디서 어떻게 진행되었나요?',
      '결혼식 날 가장 기억에 남는 순간은?',
      '당시 결혼 준비를 어떻게 하셨나요?',
      '신혼여행은 어디로 가셨나요?',
    ],
  },
]

interface ChildState {
  questions: ChildQuestion[]
  photos: DemoPhoto[]
  addQuestion: (q: { text: string; originalText?: string; anonymous: boolean; submittedBy?: string; priority: QuestionPriority }) => void
  addPhoto: (p: { caption: string; generatedQuestions: string[] }) => void
  markQuestionAsAddedFromPhoto: (photoId: string, questionText: string) => void
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      questions: INITIAL_QUESTIONS,
      photos: [],
      addQuestion: ({ text, originalText, anonymous, submittedBy, priority }) =>
        set((state) => ({
          questions: [
            {
              id: `cq_${Date.now()}`,
              text,
              originalText,
              anonymous,
              submittedBy,
              priority,
              status: 'pending' as const,
              submittedAt: new Date().toISOString().split('T')[0],
            },
            ...state.questions,
          ],
        })),
      addPhoto: (p) =>
        set((state) => ({
          photos: [
            ...state.photos,
            {
              ...p,
              id: `cp_${Date.now()}`,
              addedAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),
      markQuestionAsAddedFromPhoto: (_photoId, questionText) =>
        set((state) => ({
          questions: [
            {
              id: `cq_photo_${Date.now()}`,
              text: questionText,
              anonymous: false,
              priority: 'normal' as QuestionPriority,
              status: 'pending' as const,
              submittedAt: new Date().toISOString().split('T')[0],
            },
            ...state.questions,
          ],
        })),
    }),
    { name: 'dearlog-child' }
  )
)
