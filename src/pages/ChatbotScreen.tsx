import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../store/interviewStore'
import { generatePersonaResponse } from '../lib/agents/digitalTwin'
import type { DigitalTwinResult, ToneProfile } from '../types/agents'

const DEFAULT_TONE: ToneProfile = {
  name: '따뜻한 구어체',
  patterns: ['음...', '그래서', '참'],
}

const RELIABILITY_COLORS: Record<string, string> = {
  CONFIRMED: '#6B8F71',
  ESTIMATED: '#C8956C',
  UNVERIFIED: '#7A6A5C',
}

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  result?: DigitalTwinResult
}

function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LoadingBubble() {
  return (
    <div className="flex justify-start mb-4">
      <div
        className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ backgroundColor: '#FFFDF8' }}
      >
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#C8956C] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatbotScreen() {
  const navigate = useNavigate()
  const { transcripts } = useInterviewStore()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: '안녕하세요. 궁금한 것이 있으면 편하게 여쭤보세요.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const memoryChunks = useMemo(
    () =>
      transcripts
        .filter((t) => t.chunk)
        .map((t) => ({ ...t.chunk!, chunkId: t.id })),
    [transcripts]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const result = await generatePersonaResponse(text, memoryChunks, DEFAULT_TONE)
      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: result.responseText,
        result,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: `e_${Date.now()}`,
        role: 'ai',
        text: '죄송해요, 지금은 답하기 어렵네요. 다시 여쭤봐 주세요.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8F3EA]">
      {/* Header */}
      <div
        className="flex items-center px-5 pt-12 pb-4 flex-shrink-0"
        style={{ backgroundColor: '#8B5E3C' }}
      >
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-3">
          <BackArrow />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
          style={{ backgroundColor: '#EBC7A6' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#8B5E3C" />
            <path d="M4 20C4 16.134 7.582 13 12 13C16.418 13 20 16.134 20 20" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-[16px] font-bold text-[#FFFDF8]">부모님과 대화하기</p>
          <p className="text-[12px] text-[#EBC7A6]">기억 아카이브 기반 응답</p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[80%] flex flex-col gap-2">
              <div
                className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                }`}
                style={{
                  backgroundColor: msg.role === 'user' ? '#C8956C' : '#FFFDF8',
                }}
              >
                <p
                  className="text-[15px] leading-relaxed"
                  style={{
                    color: msg.role === 'user' ? '#FFFDF8' : '#3E3128',
                    fontStyle: msg.result?.fallbackTriggered ? 'italic' : 'normal',
                  }}
                >
                  {msg.text}
                </p>
              </div>

              {/* Evidence badge */}
              {msg.result?.evidenceBadge && !msg.result.fallbackTriggered && (
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                    style={{
                      backgroundColor:
                        RELIABILITY_COLORS[msg.result.evidenceBadge.reliability] ?? '#7A6A5C',
                    }}
                  >
                    {msg.result.evidenceBadge.reliability}
                  </span>
                  {msg.result.evidenceBadge.usedChunkIds.length > 0 && (
                    <span className="text-[10px] text-[#7A6A5C] px-2 py-0.5 rounded-full bg-[#E7DED2]">
                      근거 {msg.result.evidenceBadge.usedChunkIds.length}개
                    </span>
                  )}
                </div>
              )}

              {/* Suggested interview topic chip */}
              {msg.result?.suggestedInterviewTopic && (
                <button
                  onClick={() => navigate('/child/questions')}
                  className="self-start h-8 px-3 rounded-xl text-[12px] font-medium active:opacity-70 flex items-center gap-1"
                  style={{ backgroundColor: '#D9E0D2', color: '#3E5E41' }}
                >
                  <span>📝</span>
                  <span>{msg.result.suggestedInterviewTopic}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t border-[#E7DED2]"
        style={{ backgroundColor: '#FFFDF8' }}
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="궁금한 것을 물어보세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 h-12 rounded-2xl px-4 text-[15px] text-[#3E3128] outline-none"
            style={{ backgroundColor: '#F8F3EA', border: '1.5px solid #E7DED2' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 active:opacity-70 disabled:opacity-40"
            style={{ backgroundColor: '#C8956C' }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
