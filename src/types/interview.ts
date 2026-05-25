import type { MemoryChunk } from './agents'

export interface Question {
  id: string
  text: string
  chapterId: string
  completed: boolean
  answeredAt?: string
}

export interface Chapter {
  id: string
  title: string
  description: string
  order: number
  questions: Question[]
}

export interface Transcript {
  id: string
  questionId: string
  questionText: string
  chapterId: string
  chapterTitle: string
  originalText: string
  aiSummary: string
  recordedAt: string
  chunk?: MemoryChunk
}
