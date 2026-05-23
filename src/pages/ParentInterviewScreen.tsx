import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import { useInterviewStore } from '../store/interviewStore'
import type { Chapter, Question } from '../types/interview'

// ─── Types ───────────────────────────────────────────────────────────────────

type InterviewType = 'manual' | 'scheduled' | 'family_question'
type ScreenState = 'select' | 'incoming' | 'voice' | 'active' | 'done'
type RecordState = 'idle' | 'recording' | 'done'
type CallPhase = 'entering' | 'listening' | 'typing' | 'answered'

interface QuestionItem { question: Question; chapter: Chapter }

// ─── Demo STT responses ───────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<string, string> = {
  q4: '어릴 때는요... 딱지치기를 참 좋아했어요. 방과 후에 동네 아이들이랑 학교 앞에서 모여서 하곤 했는데, 제가 꽤 잘했거든요.',
  q5: '3학년 때 담임 선생님이 기억에 남아요. 박 선생님이셨는데 참 따뜻한 분이셨어요. 저를 많이 아껴주셨거든요.',
  q7: '그때가 참 힘들었죠. 아버지가 많이 편찮으셨던 때였는데, 그때는 정말 많이 힘들었어요.',
  q8: '선생님이 되고 싶었어요. 아이들 가르치는 게 보람 있어 보여서요.',
}
const getDemoResponse = (id: string) =>
  DEMO_RESPONSES[id] ?? '그때 일이 생각나네요. 참 소중한 기억이에요. 지금 떠올려도 마음이 따뜻해져요.'

const INCOMING_SUBTITLES: Record<InterviewType, string> = {
  manual: '오늘의 이야기를 들려주세요',
  scheduled: '약속한 시간이 됐어요 👋',
  family_question: '가족이 궁금한 게 있대요 💬',
}

// ─── Shared Dark Icons ────────────────────────────────────────────────────────

function DkMuteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="white" strokeWidth="1.8" />
      <path d="M5 11V12C5 15.87 8.13 19 12 19" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function DkKeypadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {[4, 12, 20].map((cx) =>
        [5, 12, 19].map((cy) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.5" fill="white" />
        ))
      )}
    </svg>
  )
}
function DkSpeakerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="white" />
      <path d="M19.07 4.93C20.98 6.84 22 9.36 22 12C22 14.64 20.98 17.16 19.07 19.07" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function DkNextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 4L15 12L5 20V4Z" fill="white" />
      <rect x="17" y="4" width="2" height="16" rx="1" fill="white" />
    </svg>
  )
}
function PhoneEndIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M23.54 16.26C22.49 15.21 21.1 14.63 19.62 14.63C18.14 14.63 16.74 15.21 15.69 16.26L13.85 18.1C11.01 16.67 8.63 14.29 7.2 11.45L9.04 9.61C10.09 8.56 10.67 7.17 10.67 5.69C10.67 4.21 10.09 2.81 9.04 1.76L7.34 0.060C6.29 -0.99 4.9 -0.07 4.34 0.49L0.69 4.14C0.24 4.59 -0.01 5.21 0 5.86C0.07 9.18 1.42 12.41 3.83 14.82C6.24 17.23 9.47 18.58 12.79 18.65C13.44 18.66 14.06 18.41 14.51 17.96L18.16 14.31C18.72 13.75 19.28 12.97 19.07 12.11C18.52 10.44 16.57 9.16 14.53 9.73L13.48 10.08" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function PhoneAcceptSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M6.6 10.8C8 13.6 10.4 16 13.2 17.4L15.4 15.2C15.69 14.91 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.8 8.6L6.6 10.8Z" fill="white" />
    </svg>
  )
}
function PhoneDeclineSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8C8 13.6 10.4 16 13.2 17.4L15.4 15.2C15.69 14.91 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.8 8.6L6.6 10.8Z"
        fill="white"
        transform="rotate(135 12 12)"
      />
    </svg>
  )
}

// ─── Screen 1: Mode Select ────────────────────────────────────────────────────

function ModeSelectView({
  nextItem,
  onSelect,
}: {
  nextItem: QuestionItem | null
  onSelect: (m: 'voice' | 'phone') => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      <div className="flex-1 overflow-y-auto pb-24 px-5">
        <div className="pt-14 pb-5">
          <h1 className="text-[22px] font-bold text-[#3E3128]">인터뷰 방식 선택</h1>
          <p className="mt-1 text-[16px] text-[#7A6A5C]">편한 방법으로 이야기를 들려주세요</p>
        </div>

        {nextItem && (
          <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#F2D9B8' }}>
            <p className="text-[12px] font-medium text-[#8B5E3C] mb-1">오늘의 질문 · {nextItem.chapter.title}</p>
            <p className="text-[16px] text-[#3E3128] leading-relaxed">{nextItem.question.text}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Voice card */}
          <button
            onClick={() => onSelect('voice')}
            className="rounded-2xl p-5 text-left transition-opacity active:opacity-70"
            style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4DDD0' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="11" rx="3" fill="#C8956C" />
                  <path d="M5 11V12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12V11" stroke="#C8956C" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="22" stroke="#C8956C" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[18px] font-bold text-[#3E3128]">음성으로 답하기</p>
                <p className="text-[14px] text-[#7A6A5C] mt-0.5">지금 바로 녹음해서 답변해요</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#C8956C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Phone card */}
          <button
            onClick={() => onSelect('phone')}
            className="rounded-2xl p-5 text-left transition-opacity active:opacity-70"
            style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D9E0D2' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M6.6 10.8C8 13.6 10.4 16 13.2 17.4L15.4 15.2C15.69 14.91 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.8 8.6L6.6 10.8Z" fill="#6B8F71" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[18px] font-bold text-[#3E3128]">전화로 답하기</p>
                  <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#C8956C' }}>NEW</span>
                </div>
                <p className="text-[14px] text-[#7A6A5C]">기억 친구가 전화로 질문해드려요</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#C8956C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ─── Screen 2: Incoming Call ──────────────────────────────────────────────────

function IncomingCallView({
  type,
  onAccept,
  onDecline,
}: {
  type: InterviewType
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#1C1C1E' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[28px] font-bold text-white">기억 친구</p>
          <p className="text-[16px]" style={{ color: '#8E8E93' }}>AI 인터뷰어</p>
          <p className="text-[16px] mt-1" style={{ color: '#AEAEB2' }}>{INCOMING_SUBTITLES[type]}</p>
        </div>

        {/* Avatar with pulse rings */}
        <div className="relative flex items-center justify-center mt-2">
          <div className="absolute w-32 h-32 rounded-full animate-ping opacity-10" style={{ backgroundColor: '#C8956C' }} />
          <div className="absolute w-28 h-28 rounded-full animate-pulse opacity-15" style={{ backgroundColor: '#C8956C' }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: '#3A3A3C' }}>
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="18" r="10" fill="#EBC7A6" />
              <path d="M8 44C8 34 40 34 40 44" fill="#EBC7A6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Accept / Decline */}
      <div className="flex justify-center gap-24 pb-16 pt-8">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FF3B30' }}
          >
            <PhoneDeclineSvg />
          </button>
          <span className="text-[13px] text-white">거절</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#34C759' }}
          >
            <PhoneAcceptSvg />
          </button>
          <span className="text-[13px] text-white">수락</span>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 3: Active Call ────────────────────────────────────────────────────

function ActiveCallView({
  questions,
  callSeconds,
  onCallEnd,
}: {
  questions: QuestionItem[]
  callSeconds: number
  onCallEnd: (count: number) => void
}) {
  const { markQuestionCompleted } = useInterviewStore()
  const [qIdx, setQIdx] = useState(0)
  const [phase, setPhase] = useState<CallPhase>('entering')
  const [displayText, setDisplayText] = useState('')
  const [completedCount, setCompletedCount] = useState(0)

  const currentQ = questions[qIdx]
  const demoText = getDemoResponse(currentQ?.question.id ?? '')
  const fmt = `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`

  // Phase transitions: entering → listening → typing → answered
  useEffect(() => {
    if (!currentQ) return
    if (phase === 'entering') {
      const t = setTimeout(() => setPhase('listening'), 800)
      return () => clearTimeout(t)
    }
    if (phase === 'listening') {
      const t = setTimeout(() => { setDisplayText(''); setPhase('typing') }, 2500)
      return () => clearTimeout(t)
    }
  }, [phase, currentQ])

  // Typing animation
  useEffect(() => {
    if (phase !== 'typing') return
    if (displayText.length >= demoText.length) { setPhase('answered'); return }
    const t = setTimeout(() => setDisplayText(demoText.slice(0, displayText.length + 1)), 55)
    return () => clearTimeout(t)
  }, [phase, displayText, demoText])

  const handleNext = () => {
    if (currentQ) markQuestionCompleted(currentQ.question.id)
    const newCount = completedCount + 1
    setCompletedCount(newCount)
    if (qIdx + 1 < questions.length) {
      setQIdx(qIdx + 1)
      setPhase('entering')
      setDisplayText('')
    } else {
      onCallEnd(newCount)
    }
  }

  const handleEndCall = () => {
    if (phase === 'answered' && currentQ) {
      markQuestionCompleted(currentQ.question.id)
      onCallEnd(completedCount + 1)
    } else {
      onCallEnd(completedCount)
    }
  }

  const gridBtn = (label: string, icon: React.ReactNode, onClick?: () => void, highlight?: boolean) => (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: highlight ? '#C8956C' : 'rgba(255,255,255,0.15)' }}
      >
        {icon}
      </button>
      <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#1C1C1E' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-14 pb-4">
        <p className="text-[18px] font-semibold text-white">기억 친구</p>
        <p className="text-[15px] font-medium mt-1" style={{ color: '#34C759' }}>
          통화 중  {fmt}
        </p>
      </div>

      {/* Real-time recording panel */}
      <div
        className="mx-5 rounded-2xl p-4 mb-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#34C759' }} />
          <span className="text-[12px] font-medium" style={{ color: '#34C759' }}>지금 기록 중</span>
        </div>
        <p className="text-[18px] font-medium text-white leading-relaxed mb-3">
          {currentQ?.question.text}
        </p>
        {phase === 'entering' && (
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.35)' }}>잠시 후 질문이 시작됩니다...</p>
        )}
        {phase === 'listening' && (
          <div className="flex items-center gap-1.5">
            {[0, 150, 300].map((d) => (
              <span key={d} className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
            <span className="text-[14px] ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>말씀해 주세요...</span>
          </div>
        )}
        {(phase === 'typing' || phase === 'answered') && (
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {displayText}
            {phase === 'typing' && (
              <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.8)', verticalAlign: 'middle' }} />
            )}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="px-5 mb-4">
        <p className="text-[13px] text-center mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {qIdx + 1}번째 질문 / 전체 {questions.length}개
        </p>
        <div className="flex justify-center gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i < completedCount ? '20px' : i === qIdx ? '28px' : '8px',
                backgroundColor:
                  i < completedCount ? '#34C759' : i === qIdx ? '#C8956C' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Button grid */}
      <div className="px-8 pb-4">
        {/* Row 1 */}
        <div className="flex justify-between mb-7">
          {gridBtn('음소거', <DkMuteIcon />)}
          {gridBtn('키패드', <DkKeypadIcon />)}
          {gridBtn('스피커', <DkSpeakerIcon />)}
        </div>
        {/* Row 2 */}
        <div className="flex justify-between mb-8">
          {gridBtn('다음 질문', <DkNextIcon />, phase === 'answered' ? handleNext : undefined, phase === 'answered')}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <span
                className={`w-4 h-4 rounded-full ${phase === 'typing' || phase === 'listening' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: phase === 'answered' ? '#34C759' : '#FF3B30' }}
              />
            </div>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>녹음상태</span>
          </div>
          <div className="w-16" />
        </div>
        {/* End call */}
        <div className="flex justify-center pb-6">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleEndCall}
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#FF3B30' }}
            >
              <PhoneEndIcon size={28} />
            </button>
            <span className="text-[13px] text-white">끊기</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: Voice Recording ────────────────────────────────────────────────

function VoiceView({
  item,
  onComplete,
}: {
  item: QuestionItem
  onComplete: (questionId: string) => void
}) {
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRecording = recordState === 'recording'
  const fmt = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`
  const WAVE_H = [16, 24, 32, 20, 36, 28, 16, 40, 24, 20, 32, 18, 28, 36, 22, 30, 18, 26, 32, 16]

  const handlePointerDown = () => {
    if (recordState === 'done') return
    setRecordState('recording')
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
  }
  const handlePointerUp = () => {
    if (recordState !== 'recording') return
    if (timerRef.current) clearInterval(timerRef.current)
    setRecordState(recordingSeconds >= 1 ? 'done' : 'idle')
  }
  const handleRetry = () => { setRecordState('idle'); setRecordingSeconds(0) }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      <div className="flex-1 overflow-y-auto pb-24 px-5">
        <div className="pt-14 pb-4">
          <span className="text-[12px] font-medium text-[#C8956C] bg-[#F4DDD0] px-3 py-1 rounded-full">
            {item.chapter.title}
          </span>
          <h1 className="mt-3 text-[20px] font-bold text-[#3E3128]">음성으로 답하기</h1>
        </div>

        <div className="rounded-2xl p-4 mb-8" style={{ backgroundColor: '#F2D9B8' }}>
          <p className="text-[12px] font-medium text-[#8B5E3C] mb-1">현재 질문</p>
          <p className="text-[15px] text-[#3E3128] leading-relaxed">{item.question.text}</p>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-1 h-10 mb-8">
          {WAVE_H.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-150"
              style={{
                height: isRecording ? `${h}px` : recordState === 'done' ? `${h * 0.6}px` : '6px',
                backgroundColor: isRecording ? '#C8956C' : recordState === 'done' ? '#EBC7A6' : '#E7DED2',
              }}
            />
          ))}
        </div>

        {/* Record button */}
        <div className="relative flex items-center justify-center mb-5">
          {isRecording && (
            <div className="absolute w-32 h-32 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#C8956C' }} />
          )}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            disabled={recordState === 'done'}
            className="relative w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-60"
            style={{
              backgroundColor: isRecording ? '#C8956C' : '#EBC7A6',
              boxShadow: isRecording ? '0 0 0 6px rgba(200,149,108,0.25)' : '0 4px 16px rgba(139,94,60,0.2)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" fill="#FFFDF8" />
              <path d="M5 11V12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12V11" stroke="#FFFDF8" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="22" stroke="#FFFDF8" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {recordState === 'idle' && <p className="text-center text-[14px] text-[#7A6A5C]">버튼을 길게 눌러 녹음하세요</p>}
        {recordState === 'recording' && <p className="text-center text-[15px] font-medium text-[#C8956C]">녹음 중...  {fmt}</p>}
        {recordState === 'done' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] font-medium text-[#6B8F71]">녹음 완료  {fmt}</p>
            <button onClick={handleRetry} className="text-[13px] text-[#7A6A5C] underline">다시 녹음</button>
          </div>
        )}

        <div className="mt-8">
          <Button fullWidth disabled={recordState !== 'done'} onClick={() => onComplete(item.question.id)}>
            답변 완료
          </Button>
          {recordState !== 'done' && <p className="text-center text-[13px] text-[#7A6A5C] mt-2">녹음 후 완료할 수 있어요</p>}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ─── Screen 5: Done ───────────────────────────────────────────────────────────

function DoneView({
  answeredCount,
  callSeconds,
  isPhoneMode,
  onViewTranscript,
  onGoHome,
}: {
  answeredCount: number
  callSeconds: number
  isPhoneMode: boolean
  onViewTranscript: () => void
  onGoHome: () => void
}) {
  const [bg, setBg] = useState('#1C1C1E')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setBg('#F8F3EA'), 300)
    const t2 = setTimeout(() => setVisible(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const fmt = `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: bg, transition: 'background-color 0.6s ease' }}
    >
      <div
        className="flex-1 flex flex-col items-center justify-center px-5 gap-7"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}
      >
        {/* Check circle */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D9E0D2' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M10 24L20 34L38 16"
              stroke="#6B8F71"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 46,
                strokeDashoffset: visible ? 0 : 46,
                transition: 'stroke-dashoffset 0.55s ease 0.5s',
              }}
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-[24px] font-bold text-[#3E3128]">오늘 이야기 잘 들었어요</h1>
          <p className="mt-2 text-[16px] text-[#7A6A5C]">소중한 기억이 기록되었어요</p>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[32px] font-bold text-[#C8956C]">{answeredCount}</p>
            <p className="text-[13px] text-[#7A6A5C] mt-0.5">기록된 답변</p>
          </div>
          {isPhoneMode && callSeconds > 0 && (
            <div className="text-center">
              <p className="text-[32px] font-bold text-[#C8956C]">{fmt}</p>
              <p className="text-[13px] text-[#7A6A5C] mt-0.5">총 통화 시간</p>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button fullWidth onClick={onViewTranscript}>기록 확인하기</Button>
          <Button fullWidth variant="secondary" onClick={onGoHome}>홈으로</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentInterviewScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') ?? 'manual') as InterviewType

  const { chapters } = useInterviewStore()
  const [screen, setScreen] = useState<ScreenState>(() =>
    type === 'manual' ? 'select' : 'incoming'
  )
  const [isPhoneMode, setIsPhoneMode] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [finalCallSeconds, setFinalCallSeconds] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // First 3 incomplete questions for the call session
  const sessionQuestions = useMemo<QuestionItem[]>(() => {
    const result: QuestionItem[] = []
    for (const ch of chapters) {
      for (const q of ch.questions) {
        if (!q.completed) result.push({ question: q, chapter: ch })
      }
    }
    return result.slice(0, 3)
  }, [chapters])

  const nextItem = sessionQuestions[0] ?? null

  // Start/stop call timer
  useEffect(() => {
    if (screen === 'active') {
      callTimerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [screen])

  const handleSelectMode = (mode: 'voice' | 'phone') => {
    setIsPhoneMode(mode === 'phone')
    setScreen(mode === 'phone' ? 'incoming' : 'voice')
  }

  const handleCallEnd = (count: number) => {
    setAnsweredCount(count)
    setFinalCallSeconds(callSeconds)
    setScreen('done')
  }

  const handleVoiceComplete = () => {
    setAnsweredCount(1)
    setFinalCallSeconds(0)
    setScreen('done')
  }

  if (!nextItem && screen !== 'done') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-24 gap-2">
          <p className="text-[18px] font-bold text-[#6B8F71]">모든 질문에 답변하셨어요!</p>
          <p className="text-[14px] text-[#7A6A5C]">진척도 화면에서 자서전 생성을 확인하세요</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <>
      {screen === 'select' && (
        <ModeSelectView nextItem={nextItem} onSelect={handleSelectMode} />
      )}
      {screen === 'incoming' && (
        <IncomingCallView
          type={type}
          onAccept={() => setScreen('active')}
          onDecline={() => navigate('/parent')}
        />
      )}
      {screen === 'voice' && nextItem && (
        <VoiceView item={nextItem} onComplete={handleVoiceComplete} />
      )}
      {screen === 'active' && sessionQuestions.length > 0 && (
        <ActiveCallView
          questions={sessionQuestions}
          callSeconds={callSeconds}
          onCallEnd={handleCallEnd}
        />
      )}
      {screen === 'done' && (
        <DoneView
          answeredCount={answeredCount}
          callSeconds={finalCallSeconds}
          isPhoneMode={isPhoneMode}
          onViewTranscript={() => navigate('/parent/transcript')}
          onGoHome={() => navigate('/parent')}
        />
      )}
    </>
  )
}
