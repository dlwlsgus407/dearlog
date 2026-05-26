import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarEvent } from '../types/agents'

interface CalendarState {
  events: CalendarEvent[]
  addEvent: (event: CalendarEvent) => void
  removeEvent: (eventId: string) => void
  getUpcomingEvents: (daysAhead: number) => CalendarEvent[]
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [] as CalendarEvent[],
      addEvent: (event: CalendarEvent) =>
        set((state) => ({ events: [...state.events, event] })),
      removeEvent: (eventId: string) =>
        set((state) => ({ events: state.events.filter((e) => e.eventId !== eventId) })),
      getUpcomingEvents: (daysAhead: number): CalendarEvent[] => {
        const target = new Date()
        target.setDate(target.getDate() + daysAhead)
        const targetStr = target.toISOString().split('T')[0]
        return get().events.filter((e) => e.eventDate === targetStr)
      },
    }),
    { name: 'dearlog-calendar' }
  )
)
