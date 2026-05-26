import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useInterviewStore } from '../store/interviewStore'
import { useAutobiographyStore } from '../store/autobiographyStore'
import { generateChapterDraft } from '../lib/agents/ghostwriter'
import type { Chapter } from '../types/interview'
import type { ToneProfile } from '../types/agents'

const DEFAULT_TONE: ToneProfile = { name: '따뜻한 구어체', patterns: ['음...', '그래서', '참'] }

const AUTOBIOGRAPHY_THRESHOLD = 0.8

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const [expanded, setExpanded] = useState(false)
  const total = chapter.questions.length
  const completed = chapter.questions.filter((q) => q.completed).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const canGenerate = completed / total >= AUTOBIOGRAPHY_THRESHOLD

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.07)' }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold text-[#3E3128]">{chapter.title}</span>
            {canGenerate && (
              <span className="text-[11px] font-medium text-[#6B8F71] bg-[#D9E0D2] px-2 py-0.5 rounded-full">
                생성 가능
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-[#C8956C]">{pct}%</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              className="transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M6 9L12 15L18 9" stroke="#7A6A5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-[#F4DDD0] overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: canGenerate ? '#6B8F71' : '#C8956C',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#7A6A5C]">{chapter.description}</p>
          <p className="text-[13px] text-[#7A6A5C]">
            {completed}/{total} 완료
          </p>
        </div>
      </button>

      {/* Question list (expanded) */}
      {expanded && (
        <div className="border-t border-[#E7DED2] px-5 py-3">
          <div className="flex flex-col gap-2">
            {chapter.questions.map((q) => (
              <div key={q.id} className="flex items-start gap-3 py-1">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: q.completed ? '#6B8F71' : '#E7DED2' }}
                >
                  {q.completed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="text-[14px] leading-snug"
                    style={{ color: q.completed ? '#7A6A5C' : '#3E3128' }}
                  >
                    {q.text}
                  </p>
                  {q.answeredAt && (
                    <p className="text-[11px] text-[#7A6A5C] mt-0.5">{q.answeredAt} 완료</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {canGenerate && (
            <button
              className="w-full mt-4 py-3 rounded-xl text-[14px] font-medium transition-opacity active:opacity-70"
              style={{ backgroundColor: '#D9E0D2', color: '#3E5E41' }}
            >
              챕터 자서전 미리보기
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ParentProgressScreen() {
  const navigate = useNavigate()
  const { chapters, transcripts, isChapterReady } = useInterviewStore()
  const { setChapter } = useAutobiographyStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const anyChapterReady = chapters.some((ch) => isChapterReady(ch.id))

  const handleGenerateAutobiography = async () => {
    setIsGenerating(true)
    const memoryChunks = transcripts
      .filter((t) => t.chunk)
      .map((t) => ({ ...t.chunk!, chunkId: t.id }))
    try {
      const results = await Promise.all(
        chapters.map((ch) =>
          generateChapterDraft(ch.id, ch.title, memoryChunks, DEFAULT_TONE)
        )
      )
      results.forEach((r) => setChapter(r))
      navigate('/parent/autobiography')
    } finally {
      setIsGenerating(false)
    }
  }

  const { totalQuestions, completedQuestions } = useMemo(() => {
    let total = 0
    let completed = 0
    for (const ch of chapters) {
      total += ch.questions.length
      completed += ch.questions.filter((q) => q.completed).length
    }
    return { totalQuestions: total, completedQuestions: completed }
  }, [chapters])

  const overallPct = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0

  const circumference = 2 * Math.PI * 44
  const strokeDashoffset = circumference * (1 - overallPct / 100)

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-14 pb-6">
          <h1 className="text-[22px] font-bold text-[#3E3128]">진척도</h1>
          <p className="mt-0.5 text-[16px] text-[#7A6A5C]">챕터별 완료 현황을 확인하세요</p>
        </div>

        {/* Overall circle progress */}
        <div
          className="mx-5 rounded-2xl p-6 mb-6 flex items-center gap-6"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#F4DDD0" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="#C8956C"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-[#3E3128]">{overallPct}%</span>
            </div>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#3E3128] mb-1">전체 진척도</p>
            <p className="text-[14px] text-[#7A6A5C] mb-3">
              {completedQuestions}/{totalQuestions}개 완료
            </p>
            <p className="text-[13px] text-[#7A6A5C] leading-relaxed">
              80% 이상 완료 시{'\n'}챕터 자서전 생성이 가능해요
            </p>
          </div>
        </div>

        {/* Chapter list */}
        <div className="px-5">
          <h2 className="text-[16px] font-bold text-[#3E3128] mb-3">챕터별 현황</h2>
          {chapters.map((ch) => (
            <ChapterCard key={ch.id} chapter={ch} />
          ))}
        </div>
      </div>

      <BottomNav />

      {/* Generate autobiography button */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5"
        style={{ pointerEvents: 'none' }}
      >
        <button
          onClick={handleGenerateAutobiography}
          disabled={!anyChapterReady || isGenerating}
          className="w-full h-14 rounded-2xl text-[16px] font-bold transition-all active:opacity-70 disabled:opacity-40"
          style={{
            backgroundColor: '#C8956C',
            color: '#FFFDF8',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(200,149,108,0.4)',
          }}
        >
          {isGenerating ? '자서전을 쓰고 있어요...' : '자서전 생성하기'}
        </button>
      </div>

      {/* Loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: 'rgba(248,243,234,0.92)' }}>
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ backgroundColor: '#C8956C' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="animate-pulse">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[18px] font-bold text-[#3E3128] mb-2">자서전을 쓰고 있어요</p>
          <p className="text-[14px] text-[#7A6A5C]">부모님의 이야기를 정리하는 중입니다...</p>
        </div>
      )}
    </div>
  )
}
