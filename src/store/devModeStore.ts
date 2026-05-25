import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DevModeState {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set) => ({
      isDemoMode: true,
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
    }),
    { name: 'dearlog-dev-mode' }
  )
)
