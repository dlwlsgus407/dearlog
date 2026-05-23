import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useInterviewStore } from '../store/interviewStore'

export default function MyPageScreen() {
  const navigate = useNavigate()
  const { userName, role, setUserName, reset } = useAuthStore()
  const { chapters, transcripts } = useInterviewStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)

  const completedQ = chapters.reduce(
    (a, ch) => a + ch.questions.filter((q) => q.completed).length,
    0
  )

  const handleSaveName = () => {
    if (nameInput.trim()) setUserName(nameInput.trim())
    setEditingName(false)
  }

  const handleLogout = () => {
    reset()
    navigate('/select-mode', { replace: true })
  }

  const backPath = role === 'parent' ? '/parent' : '/child'

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4">
        <button onClick={() => navigate(backPath)} className="p-2 -ml-2 mr-2">
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

      <div className="flex-1 overflow-y-auto pb-10 px-5">
        {/* Profile card */}
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
                className="text-[14px] text-[#C8956C] font-medium"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[19px] font-bold text-[#3E3128]">
                {userName || '이름 없음'}
              </span>
              <button
                onClick={() => {
                  setNameInput(userName)
                  setEditingName(true)
                }}
                className="p-1"
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
            className={`text-[12px] font-medium px-3 py-1 rounded-full ${
              role === 'parent'
                ? 'bg-[#F4DDD0] text-[#8B5E3C]'
                : 'bg-[#D9E0D2] text-[#4A6B50]'
            }`}
          >
            {role === 'parent' ? '부모님 · 이야기 주인' : '자녀 · 기록 참여자'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
          >
            <p className="text-[30px] font-bold text-[#C8956C]">{completedQ}</p>
            <p className="text-[12px] text-[#7A6A5C] mt-0.5">완료한 질문</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
          >
            <p className="text-[30px] font-bold text-[#C8956C]">{transcripts.length}</p>
            <p className="text-[12px] text-[#7A6A5C] mt-0.5">기록된 이야기</p>
          </div>
        </div>

        {/* Personal info */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="px-5 py-3 border-b border-[#E7DED2]">
            <span className="text-[13px] font-medium text-[#7A6A5C]">인적사항</span>
          </div>
          {[
            { label: '이름', value: userName || '미입력' },
            { label: '생년월일', value: '1955년 3월 15일' },
            { label: '전화번호', value: '010-1234-5678' },
            { label: '가족 그룹 코드', value: 'DEAR-4829' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-4 border-b border-[#E7DED2] last:border-0"
            >
              <span className="text-[15px] text-[#7A6A5C]">{label}</span>
              <span className="text-[15px] font-medium text-[#3E3128]">{value}</span>
            </div>
          ))}
        </div>

        {/* App settings */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.08)' }}
        >
          <div className="px-5 py-3 border-b border-[#E7DED2]">
            <span className="text-[13px] font-medium text-[#7A6A5C]">앱 설정</span>
          </div>
          {[
            { label: '알림 설정', value: '켜짐' },
            { label: '앱 버전', value: '1.0.0 (데모)' },
            { label: '개인정보 처리방침', value: '' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-4 border-b border-[#E7DED2] last:border-0"
            >
              <span className="text-[15px] text-[#3E3128]">{label}</span>
              <span className="text-[14px] text-[#7A6A5C]">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border border-[#E7DED2] text-[15px] text-[#7A6A5C] active:opacity-70"
          style={{ backgroundColor: '#FFFDF8' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
