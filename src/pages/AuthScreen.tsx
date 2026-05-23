import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuthStore } from '../store/authStore'

type Tab = 'login' | 'signup'

export default function AuthScreen() {
  const navigate = useNavigate()
  const { setUserName } = useAuthStore()
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return
    setUserName(name.trim())
    navigate('/select-mode')
  }

  return (
    <div className="flex flex-col h-screen px-6">
      {/* Header */}
      <div className="pt-14 pb-8 shrink-0">
        <h1 className="text-[24px] font-bold text-[#3E3128]">환영합니다</h1>
        <p className="mt-1 text-[16px] text-[#7A6A5C]">DEARLOG와 함께 이야기를 시작하세요</p>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 mb-8">
        {(['login', 'signup'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 pb-3 text-[16px] font-medium transition-colors border-b-2"
            style={{
              color: tab === t ? '#8B5E3C' : '#7A6A5C',
              borderBottomColor: tab === t ? '#8B5E3C' : '#E7DED2',
            }}
          >
            {t === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-[16px] font-medium text-[#3E3128] mb-2">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            className="w-full min-h-[52px] px-4 rounded-xl border bg-[#FFFDF8] text-[16px] text-[#3E3128] placeholder:text-[#C7D1BE] outline-none transition-colors"
            style={{ borderColor: '#E7DED2' }}
            onFocus={(e) => (e.target.style.borderColor = '#8B5E3C')}
            onBlur={(e) => (e.target.style.borderColor = '#E7DED2')}
          />
        </div>

        {tab === 'signup' && (
          <div>
            <label className="block text-[16px] font-medium text-[#3E3128] mb-2">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full min-h-[52px] px-4 rounded-xl border bg-[#FFFDF8] text-[16px] text-[#3E3128] placeholder:text-[#C7D1BE] outline-none transition-colors"
              style={{ borderColor: '#E7DED2' }}
              onFocus={(e) => (e.target.style.borderColor = '#8B5E3C')}
              onBlur={(e) => (e.target.style.borderColor = '#E7DED2')}
            />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto pb-12">
        <Button fullWidth disabled={!name.trim()} onClick={handleSubmit}>
          {tab === 'login' ? '로그인' : '가입하기'}
        </Button>
      </div>
    </div>
  )
}
