import { useState } from 'react'
import ChildBottomNav from '../components/ChildBottomNav'
import { useAuthStore } from '../store/authStore'
import { useChildStore } from '../store/childStore'
import { reformulateQuestion } from '../lib/agents/questionQueue'
import type { QuestionPriority } from '../types/child'

const PRIORITY_META: Record<QuestionPriority, { label: string; bg: string; text: string; dot: string }> = {
  urgent: { label: '긴급', bg: '#F4DDD0', text: '#8B5E3C', dot: '#C8956C' },
  normal: { label: '일반', bg: '#E7DED2', text: '#7A6A5C', dot: '#7A6A5C' },
  interest: { label: '관심', bg: '#D9E0D2', text: '#3E5E41', dot: '#6B8F71' },
}

export default function ChildQuestionsScreen() {
  const { userName } = useAuthStore()
  const { questions, addQuestion } = useChildStore()

  const [text, setText] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [priority, setPriority] = useState<QuestionPriority>('normal')
  const [submitted, setSubmitted] = useState(false)
  const [isReformulating, setIsReformulating] = useState(false)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [pendingOriginal, setPendingOriginal] = useState<string>('')

  const PRIORITY_NUM: Record<QuestionPriority, number> = { urgent: 3, normal: 2, interest: 1 }

  const handleSubmit = async () => {
    if (!text.trim() || isReformulating) return
    setIsReformulating(true)
    const original = text.trim()
    try {
      const result = await reformulateQuestion(original, PRIORITY_NUM[priority], anonymous, '인생 이야기')
      if (result.sensitivityLevel === 'high') {
        setPreviewText(result.reformulatedQuestion)
        setPendingOriginal(original)
        setIsReformulating(false)
        return
      }
      addQuestion({
        text: result.reformulatedQuestion,
        originalText: original,
        anonymous,
        submittedBy: anonymous ? undefined : (userName || '자녀'),
        priority,
      })
    } catch {
      addQuestion({
        text: original,
        anonymous,
        submittedBy: anonymous ? undefined : (userName || '자녀'),
        priority,
      })
    } finally {
      setIsReformulating(false)
    }
    setText('')
    setAnonymous(false)
    setPriority('normal')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const confirmPreview = () => {
    if (!previewText) return
    addQuestion({
      text: previewText,
      originalText: pendingOriginal,
      anonymous,
      submittedBy: anonymous ? undefined : (userName || '자녀'),
      priority,
    })
    setPreviewText(null)
    setPendingOriginal('')
    setText('')
    setAnonymous(false)
    setPriority('normal')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const sorted = [...questions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      {/* Sensitivity preview modal */}
      {previewText && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full rounded-t-3xl p-6 pb-10" style={{ backgroundColor: '#FFFDF8' }}>
            <p className="text-[16px] font-bold text-[#3E3128] mb-1">이렇게 전달될 예정이에요</p>
            <p className="text-[13px] text-[#7A6A5C] mb-4">민감한 표현이 있어 부드럽게 바꿨어요</p>
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#F2D9B8' }}>
              <p className="text-[15px] text-[#3E3128] leading-relaxed">{previewText}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewText(null)}
                className="flex-1 min-h-[48px] rounded-xl text-[15px] font-medium"
                style={{ backgroundColor: '#E7DED2', color: '#7A6A5C' }}
              >
                취소
              </button>
              <button
                onClick={confirmPreview}
                className="flex-1 min-h-[48px] rounded-xl text-[15px] font-medium text-white"
                style={{ backgroundColor: '#C8956C' }}
              >
                이대로 등록
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-14 pb-5">
          <h1 className="text-[22px] font-bold text-[#3E3128]">질문 등록</h1>
          <p className="mt-0.5 text-[16px] text-[#7A6A5C]">부모님께 드리고 싶은 질문을 등록하세요</p>
        </div>

        {/* Question form */}
        <div
          className="mx-5 rounded-2xl p-5 mb-6"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          {/* Textarea */}
          <label className="block text-[14px] font-medium text-[#3E3128] mb-2">
            질문 내용
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="부모님께 여쭤보고 싶은 질문을 입력하세요..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-[15px] text-[#3E3128] resize-none outline-none leading-relaxed"
            style={{
              backgroundColor: '#F8F3EA',
              border: '1.5px solid #E7DED2',
              caretColor: '#C8956C',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#C8956C')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E7DED2')}
          />

          {/* Priority */}
          <div className="mt-4 mb-4">
            <p className="text-[14px] font-medium text-[#3E3128] mb-2">우선순위</p>
            <div className="flex gap-2">
              {(Object.entries(PRIORITY_META) as [QuestionPriority, typeof PRIORITY_META[QuestionPriority]][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setPriority(key)}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
                    style={{
                      backgroundColor: priority === key ? meta.bg : '#F8F3EA',
                      color: priority === key ? meta.text : '#7A6A5C',
                      border: `1.5px solid ${priority === key ? meta.dot : '#E7DED2'}`,
                    }}
                  >
                    {meta.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[#E7DED2] mb-4">
            <div>
              <p className="text-[15px] font-medium text-[#3E3128]">익명으로 등록</p>
              <p className="text-[12px] text-[#7A6A5C] mt-0.5">
                {anonymous ? '작성자가 표시되지 않아요' : `'${userName || '자녀'}'로 표시돼요`}
              </p>
            </div>
            <button
              onClick={() => setAnonymous((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{ backgroundColor: anonymous ? '#C8956C' : '#C7D1BE' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: anonymous ? 'translateX(24px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isReformulating}
            className="w-full min-h-[48px] rounded-xl text-[16px] font-medium transition-all duration-150 disabled:opacity-40"
            style={{
              backgroundColor: submitted ? '#6B8F71' : '#C8956C',
              color: 'white',
            }}
          >
            {submitted ? '등록됐어요 ✓' : isReformulating ? '질문을 정리하고 있어요...' : '등록하기'}
          </button>
        </div>

        {/* Question list */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[#3E3128]">등록한 질문</h2>
            <span className="text-[13px] text-[#7A6A5C]">총 {questions.length}개</span>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[15px] text-[#7A6A5C]">아직 등록한 질문이 없어요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((q) => {
                const meta = PRIORITY_META[q.priority]
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl px-4 py-4"
                    style={{ backgroundColor: '#FFFDF8', boxShadow: '0 1px 8px rgba(139,94,60,0.06)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: meta.bg, color: meta.text }}
                      >
                        {meta.label}
                      </span>
                      <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: q.status === 'answered' ? '#D9E0D2' : '#F4DDD0',
                          color: q.status === 'answered' ? '#3E5E41' : '#8B5E3C',
                        }}
                      >
                        {q.status === 'answered' ? '답변 완료' : '대기 중'}
                      </span>
                    </div>
                    <p className="text-[15px] text-[#3E3128] leading-relaxed mb-2">{q.text}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-[#7A6A5C]">
                        {q.anonymous ? '익명' : q.submittedBy}  ·  {q.submittedAt}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ChildBottomNav />
    </div>
  )
}
