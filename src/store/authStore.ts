import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '../types/user'

interface AuthState {
  role: UserRole | null
  userName: string
  setRole: (role: UserRole) => void
  setUserName: (name: string) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      userName: '',
      setRole: (role) => set({ role }),
      setUserName: (userName) => set({ userName }),
      reset: () => set({ role: null, userName: '' }),
    }),
    { name: 'dearlog-auth' }
  )
)
