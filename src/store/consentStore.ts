import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConsentItem {
  publish: boolean
  chatbot: boolean
}

interface ConsentState {
  consents: Record<string, ConsentItem>
  setConsent: (transcriptId: string, key: 'publish' | 'chatbot', value: boolean) => void
  setAll: (transcriptIds: string[], publish: boolean, chatbot: boolean) => void
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      consents: {},
      setConsent: (id, key, value) =>
        set((state) => ({
          consents: {
            ...state.consents,
            [id]: Object.assign({ publish: true, chatbot: true }, state.consents[id], { [key]: value }),
          },
        })),
      setAll: (ids, publish, chatbot) =>
        set((state) => ({
          consents: ids.reduce(
            (acc, id) => ({ ...acc, [id]: { publish, chatbot } }),
            { ...state.consents }
          ),
        })),
    }),
    { name: 'dearlog-consent' }
  )
)
