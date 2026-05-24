import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useInterviewStore } from '../store/interviewStore'
import { useConsentStore } from '../store/consentStore'

const FAMILY_MEMBERS = [
  { name: '김영자', role: 'parent' as const },
  { name: '김민준', role: 'child' as const },
  { name: '김지영', role: 'child' as const },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative flex-shrink-0"
      style={{ width: 44, height: 26 }}
      aria-pressed={on}
    >
      <div
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: on ? '#C8956C' : '#E7DED2' }}
      />
      <div
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? 20 : 2, top: 1 }}
      />
    </button>
  )
}

export default function MyPageScreen() {
  const navigate = useNavigate()
  const { userName, role, setUserName, reset } = useAuthStore()
  const { transcripts } = useInterviewStore()
  const { consents, setConsent, setAll } = useConsentStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [notifOn, setNotifOn] = useState(true)

  const getConsent = (id: string) => consents[id] ?? { publish: true, chatbot: true }

  // 챕터별 그룹핑 (챕터 순서 유지)
  const grouped = transcripts.reduce<Record<string, { title: string; ids: string[] }>>(
    (acc, t) => {
      if (!acc[t.chapterId]) acc[t.chapterId] = { title: t.chapterTitle, ids: [] }
      acc[t.chapterId].ids.push(t.id)
      return acc
    },
    {}
  )
  const groupEntries = Object.entries(grouped)
  const allIds = transcripts.map((t) => t.id)

  const handleSaveName = () => {
    if (nameInput.trim()) setUserName(nameInput.trim())
    setEditingName(false)
  }

  const handleLogout = () => {
    reset()
    navigate('/splash', { replace: true })
  }

  const backPath = role === 'parent' ? '/parent' : '/child'

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 -ml-2 mr-2 min-h-[48px] flex items-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#3E3128"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-[18px] font-bold text-[#3E3128]">마이페이지</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 px-5">
        {/* 내 정보 카드 */}
        <div
          className="rounded-2xl p-5 mb-4 flex flex-col items-center"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="w-20 h-20 rounded-full bg-[#EBC7A6] flex items-center justify-center mb-3">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="16" r="8" fill="#8B5E3C" />
              <path
                d="M6 40C6 31.163 13.163 25 22 25C30.837 25 38 31.163 38 40"
                stroke="#8B5E3C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {editingName ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#C8956C] bg-[#F8F3EA] text-[17px] font-bold text-[#3E3128] text-center focus:outline-none w-36"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                className="text-[14px] text-[#C8956C] font-medium min-h-[48px] px-1"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[19px] font-bold text-[#3E3128]">{userName || '이름 없음'}</span>
              <button
                onClick={() => { setNameInput(userName); setEditingName(true) }}
                className="p-1 min-h-[48px] flex items-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13"
                    stroke="#7A6A5C"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                    stroke="#7A6A5C"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          <span
            className={`text-[12px] font-medium px-3 py-1 rounded-full mb-3 ${
              role === 'parent' ? 'bg-[#F4DDD0] text-[#8B5E3C]' : 'bg-[#D9E0D2] text-[#4A6B50]'
            }`}
          >
            {role === 'parent' ? '부모님 · 이야기 주인' : '자녀 · 기록 참여자'}
          </span>

          <div className="w-full border-t border-[#E7DED2] pt-3 flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.69 6.45 9.06 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
                fill="none"
                stroke="#7A6A5C"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[14px] text-[#7A6A5C]">010-1234-5678</span>
          </div>
        </div>

        {/* 가족 구성원 */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="px-5 py-3 border-b border-[#E7DED2]">
            <span className="text-[13px] font-medium text-[#7A6A5C]">가족 구성원</span>
          </div>
          {FAMILY_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="flex items-center justify-between px-5 py-4 border-b border-[#E7DED2] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: member.role === 'parent' ? '#EBC7A6' : '#D9E0D2' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      fill={member.role === 'parent' ? '#8B5E3C' : '#4A6B50'}
                    />
                    <path
                      d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20"
                      stroke={member.role === 'parent' ? '#8B5E3C' : '#4A6B50'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-[16px] font-medium text-[#3E3128]">{member.name}</span>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  member.role === 'parent'
                    ? 'bg-[#F4DDD0] text-[#8B5E3C]'
                    : 'bg-[#D9E0D2] text-[#4A6B50]'
                }`}
              >
                {member.role === 'parent' ? '부모님' : '자녀'}
              </span>
            </div>
          ))}
        </div>

        {/* 동의 설정 */}
        <div className="mb-4">
          {/* 섹션 헤더 + 일괄 설정 */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <p className="text-[15px] font-bold text-[#3E3128]">동의 설정</p>
              <p className="text-[12px] text-[#7A6A5C] mt-0.5">답변별로 공개 범위를 설정하세요</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAll(allIds, true, true)}
                className="px-3 h-8 rounded-full text-[12px] font-medium border active:opacity-70"
                style={{ borderColor: '#C8956C', color: '#C8956C', backgroundColor: '#FFFDF8' }}
              >
                전체 공개
              </button>
              <button
                onClick={() => setAll(allIds, false, false)}
                className="px-3 h-8 rounded-full text-[12px] font-medium border active:opacity-70"
                style={{ borderColor: '#E7DED2', color: '#7A6A5C', backgroundColor: '#FFFDF8' }}
              >
                전체 비공개
              </button>
            </div>
          </div>

          {transcripts.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-8 text-center"
              style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
            >
              <p className="text-[14px] text-[#7A6A5C]">아직 기록된 답변이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groupEntries.map(([chapterId, { title, ids }]) => (
                <div
                  key={chapterId}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
                >
                  {/* 챕터 헤더 */}
                  <div className="px-5 py-3 border-b border-[#E7DED2] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#C8956C]" />
                    <span className="text-[13px] font-semibold text-[#8B5E3C]">{title}</span>
                  </div>

                  {/* 답변 항목 */}
                  {ids.map((id, idx) => {
                    const t = transcripts.find((tr) => tr.id === id)!
                    const c = getConsent(id)
                    const preview =
                      t.originalText.length > 30
                        ? t.originalText.slice(0, 30) + '...'
                        : t.originalText
                    return (
                      <div
                        key={id}
                        className={`px-5 py-4 ${idx < ids.length - 1 ? 'border-b border-[#E7DED2]' : ''}`}
                      >
                        {/* 답변 미리보기 */}
                        <p className="text-[13px] font-medium text-[#3E3128] mb-1 leading-snug">
                          {t.questionText.length > 24
                            ? t.questionText.slice(0, 24) + '...'
                            : t.questionText}
                        </p>
                        <p className="text-[12px] text-[#7A6A5C] mb-3 leading-snug">
                          "{preview}"
                        </p>

                        {/* 토글 행 */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M12 2L2 7L12 12L22 7L12 2Z"
                                  stroke={c.publish ? '#C8956C' : '#C7D1BE'}
                                  strokeWidth="2"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 17L12 22L22 17"
                                  stroke={c.publish ? '#C8956C' : '#C7D1BE'}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 12L12 17L22 12"
                                  stroke={c.publish ? '#C8956C' : '#C7D1BE'}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="text-[14px] text-[#3E3128]">자서전 출판</span>
                            </div>
                            <Toggle
                              on={c.publish}
                              onChange={() => setConsent(id, 'publish', !c.publish)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
                                  stroke={c.chatbot ? '#6B8F71' : '#C7D1BE'}
                                  strokeWidth="2"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="text-[14px] text-[#3E3128]">챗봇 사용</span>
                            </div>
                            <Toggle
                              on={c.chatbot}
                              onChange={() => setConsent(id, 'chatbot', !c.chatbot)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 알림 설정 */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="px-5 py-3 border-b border-[#E7DED2]">
            <span className="text-[13px] font-medium text-[#7A6A5C]">알림 설정</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[16px] text-[#3E3128]">푸시 알림</p>
              <p className="text-[12px] text-[#7A6A5C] mt-0.5">인터뷰 일정 및 새 답변 알림</p>
            </div>
            <Toggle on={notifOn} onChange={() => setNotifOn((v) => !v)} />
          </div>
        </div>

        {/* 인터뷰 캘린더 바로가기 */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <button
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center justify-between px-5 py-4 active:opacity-70 min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F4DDD0] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#8B5E3C" strokeWidth="1.8" />
                  <path d="M3 9H21" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M8 2V5M16 2V5" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" />
                  <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#8B5E3C" />
                </svg>
              </div>
              <span className="text-[16px] text-[#3E3128]">인터뷰 캘린더</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="#7A6A5C"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border border-[#E7DED2] text-[16px] text-[#7A6A5C] active:opacity-70"
          style={{ backgroundColor: '#FFFDF8' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
