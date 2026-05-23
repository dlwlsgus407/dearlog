export type QuestionPriority = 'urgent' | 'normal' | 'interest'
export type QuestionStatus = 'pending' | 'answered'

export interface ChildQuestion {
  id: string
  text: string
  anonymous: boolean
  submittedBy?: string
  priority: QuestionPriority
  status: QuestionStatus
  submittedAt: string
}

export interface DemoPhoto {
  id: string
  caption: string
  generatedQuestions: string[]
  addedAt: string
}
