import { useMemo } from 'react'
import ChildBottomNav from '../components/ChildBottomNav'
import { useInterviewStore } from '../store/interviewStore'
import { useChildStore } from '../store/childStore'

const AUTOBIOGRAPHY_THRESHOLD = 0.8

export default function ChildProgressScreen() {
  const { chapters } = useInterviewStore()
  const { questions } = useChildStore()

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

  const pendingQuestions = useMemo(() => questions.filter((q) => q.status === 'pending').length, [questions])
  const answeredQuestions = useMemo(() => questions.filter((q) => q.status === 'answered').length, [questions])

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-14 pb-6">
          <h1 className="text-[22px] font-bold text-[#3E3128]">진척도</h1>
          <p className="mt-0.5 text-[16px] text-[#7A6A5C]">자서전 제작 현황을 한눈에 확인하세요</p>
        </div>

        {/* Overall circle */}
        <div
          className="mx-5 rounded-2xl p-6 mb-5 flex items-center gap-6"
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
            <p className="text-[16px] font-bold text-[#3E3128] mb-1">전체 완료율</p>
            <p className="text-[14px] text-[#7A6A5C] mb-2">
              {completedQuestions}/{totalQuestions}개 답변 완료
            </p>
            <p className="text-[13px] text-[#7A6A5C] leading-relaxed">
              80% 이상이면 챕터별{'\n'}자서전 생성 가능해요
            </p>
          </div>
        </div>

        {/* Child questions summary */}
        <div
          className="mx-5 rounded-2xl p-5 mb-5"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <h2 className="text-[15px] font-bold text-[#3E3128] mb-3">내가 등록한 질문</h2>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: '#F4DDD0' }}>
              <p className="text-[18px] font-bold text-[#C8956C]">{pendingQuestions}</p>
              <p className="text-[11px] text-[#7A6A5C] mt-0.5">답변 대기</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: '#D9E0D2' }}>
              <p className="text-[18px] font-bold text-[#6B8F71]">{answeredQuestions}</p>
              <p className="text-[11px] text-[#7A6A5C] mt-0.5">답변 완료</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: '#EBC7A6' }}>
              <p className="text-[18px] font-bold text-[#8B5E3C]">{questions.length}</p>
              <p className="text-[11px] text-[#7A6A5C] mt-0.5">총 등록</p>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <div className="px-5">
          <h2 className="text-[16px] font-bold text-[#3E3128] mb-3">챕터별 현황</h2>
          <div className="flex flex-col gap-3">
            {chapters.map((ch) => {
              const total = ch.questions.length
              const completed = ch.questions.filter((q) => q.completed).length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              const canGenerate = completed / total >= AUTOBIOGRAPHY_THRESHOLD

              return (
                <div
                  key={ch.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#FFFDF8', boxShadow: '0 1px 8px rgba(139,94,60,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#3E3128]">{ch.title}</span>
                      {canGenerate && (
                        <span className="text-[11px] font-medium text-[#6B8F71] bg-[#D9E0D2] px-2 py-0.5 rounded-full">
                          생성 가능
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#C8956C]">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F4DDD0] overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: canGenerate ? '#6B8F71' : '#C8956C',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[#7A6A5C]">{ch.description}</p>
                    <p className="text-[12px] text-[#7A6A5C]">{completed}/{total}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ChildBottomNav />
    </div>
  )
}
