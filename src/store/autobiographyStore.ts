import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GhostwriterResult } from '../types/agents'

interface AutobiographyState {
  chapters: GhostwriterResult[]
  setChapter: (result: GhostwriterResult) => void
  clearAll: () => void
}

export const useAutobiographyStore = create<AutobiographyState>()(
  persist(
    (set) => ({
      chapters: [],
      setChapter: (result) =>
        set((state) => {
          const idx = state.chapters.findIndex((c) => c.chapterId === result.chapterId)
          if (idx >= 0) {
            const chapters = [...state.chapters]
            chapters[idx] = result
            return { chapters }
          }
          return { chapters: [...state.chapters, result] }
        }),
      clearAll: () => set({ chapters: [] }),
    }),
    { name: 'dearlog-autobiography' }
  )
)
