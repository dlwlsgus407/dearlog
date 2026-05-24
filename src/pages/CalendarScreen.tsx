import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useInterviewStore } from '../store/interviewStore'
import type { Transcript } from '../types/interview'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="#3E3128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="#3E3128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="#3E3128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TranscriptCard({ t }: { t: Transcript }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#F2D9B8' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-[#8B5E3C] bg-[#EBC7A6] px-2 py-0.5 rounded-full">
          {t.chapterTitle}
        </span>
      </div>
      <p className="text-[14px] font-medium text-[#3E3128] mb-1">{t.questionText}</p>
      <p className="text-[13px] text-[#7A6A5C] leading-relaxed line-clamp-2">{t.originalText}</p>
    </div>
  )
}

export default function CalendarScreen() {
  const navigate = useNavigate()
  const { role } = useAuthStore()
  const { transcripts } = useInterviewStore()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr)

  const transcriptDateMap = useMemo(() => {
    const map = new Map<string, Transcript[]>()
    for (const t of transcripts) {
      const arr = map.get(t.recordedAt) ?? []
      arr.push(t)
      map.set(t.recordedAt, arr)
    }
    return map
  }, [transcripts])

  const calendarCells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setSelectedDate(null)
  }

  const selectedTranscripts = selectedDate ? (transcriptDateMap.get(selectedDate) ?? []) : []
  const recordCount = transcriptDateMap.size

  const backPath = role === 'parent' ? '/parent' : '/child'

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4">
        <button onClick={() => navigate(backPath)} className="p-2 -ml-2 mr-2">
          <BackArrow />
        </button>
        <h1 className="text-[18px] font-bold text-[#3E3128]">캘린더</h1>
        <span className="ml-auto text-[13px] text-[#7A6A5C]">기록 {recordCount}일</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 px-5">
        {/* Month navigation */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F4DDD0] active:opacity-70"
            >
              <ChevronLeft />
            </button>
            <span className="text-[17px] font-bold text-[#3E3128]">
              {year}년 {MONTH_NAMES[month]}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F4DDD0] active:opacity-70"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className="text-center text-[12px] font-medium py-1"
                style={{ color: i === 0 ? '#C8956C' : i === 6 ? '#8B5E3C' : '#7A6A5C' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />

              const dateStr = fmt(day)
              const hasRecord = transcriptDateMap.has(dateStr)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dow = idx % 7

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className="flex flex-col items-center py-1 rounded-xl transition-colors active:opacity-70"
                  style={{
                    backgroundColor: isSelected ? '#C8956C' : isToday ? '#F4DDD0' : 'transparent',
                  }}
                >
                  <span
                    className="text-[15px] font-medium"
                    style={{
                      color: isSelected
                        ? '#FFFDF8'
                        : isToday
                        ? '#8B5E3C'
                        : dow === 0
                        ? '#C8956C'
                        : dow === 6
                        ? '#8B5E3C'
                        : '#3E3128',
                    }}
                  >
                    {day}
                  </span>
                  {hasRecord && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: isSelected ? '#FFFDF8' : '#C8956C' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E7DED2]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8956C]" />
              <span className="text-[12px] text-[#7A6A5C]">인터뷰 기록</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded-xl flex items-center justify-center text-[12px] font-medium"
                style={{ backgroundColor: '#F4DDD0', color: '#8B5E3C' }}
              >
                오
              </span>
              <span className="text-[12px] text-[#7A6A5C]">오늘</span>
            </div>
          </div>
        </div>

        {/* Selected date panel */}
        {selectedDate && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-[#3E3128]">
                {selectedDate.replace(/-/g, '.')}
              </h2>
              {selectedTranscripts.length === 0 && (
                <span className="text-[13px] text-[#7A6A5C]">기록 없음</span>
              )}
            </div>

            {selectedTranscripts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {selectedTranscripts.map((t) => (
                  <TranscriptCard key={t.id} t={t} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
              >
                <p className="text-[15px] text-[#7A6A5C]">이 날에는 기록된 이야기가 없어요</p>
                {role === 'parent' && (
                  <button
                    onClick={() => navigate('/parent/interview')}
                    className="mt-3 h-10 px-5 rounded-xl bg-[#F4DDD0] text-[13px] font-medium text-[#8B5E3C] active:opacity-70"
                  >
                    인터뷰 시작하기
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
