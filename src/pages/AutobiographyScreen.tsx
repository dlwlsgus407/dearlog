import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePDF } from '@react-pdf/renderer'
import { useAutobiographyStore } from '../store/autobiographyStore'
import { useAuthStore } from '../store/authStore'
import { AutobiographyPDF } from '../components/AutobiographyPDF'
import type { GhostwriterResult, Paragraph, ReliabilityLabel } from '../types/agents'

const RELIABILITY_LABEL: Record<ReliabilityLabel, string> = {
  CONFIRMED: '확인됨',
  ESTIMATED: '추정됨',
  UNVERIFIED: '미검증',
}
const RELIABILITY_COLOR: Record<ReliabilityLabel, string> = {
  CONFIRMED: '#6B8F71',
  ESTIMATED: '#C8956C',
  UNVERIFIED: '#7A6A5C',
}

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="#3E3128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ParagraphCard({ para }: { para: Paragraph }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.07)' }}
    >
      <p className="text-[15px] text-[#3E3128] leading-relaxed mb-3">{para.text}</p>
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: RELIABILITY_COLOR[para.reliability] }}
        >
          {RELIABILITY_LABEL[para.reliability]}
        </span>
        {para.sourceChunkIds.length > 0 && (
          <span className="text-[10px] text-[#7A6A5C] px-2 py-0.5 rounded-full bg-[#F4DDD0]">
            근거 {para.sourceChunkIds.length}개
          </span>
        )}
      </div>
      {para.uncertaintyNote && (
        <p className="text-[12px] text-[#7A6A5C] mt-2 italic">{para.uncertaintyNote}</p>
      )}
    </div>
  )
}

function MissingSection({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3 flex items-center gap-3"
      style={{ border: '2px dashed #E7DED2', backgroundColor: 'transparent' }}
    >
      <span className="text-[20px]">✏️</span>
      <p className="text-[14px] text-[#7A6A5C]">{text}</p>
    </div>
  )
}

function EmptyChapter() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 12px rgba(139,94,60,0.07)' }}
    >
      <p className="text-[16px] text-[#7A6A5C] mb-2">아직 생성된 내용이 없어요</p>
      <p className="text-[13px] text-[#7A6A5C]">진척도 화면에서 자서전을 생성해 보세요</p>
    </div>
  )
}

function ChapterView({ chapter }: { chapter: GhostwriterResult }) {
  if (chapter.paragraphs.length === 0 && chapter.missingSections.length === 0) {
    return <EmptyChapter />
  }
  return (
    <div>
      {chapter.toneProfile && (
        <div
          className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
          style={{ backgroundColor: '#F4DDD0' }}
        >
          <span className="text-[12px] text-[#8B5E3C]">말투: {chapter.toneProfile.name}</span>
        </div>
      )}
      {chapter.paragraphs.map((para) => (
        <ParagraphCard key={para.paragraphId} para={para} />
      ))}
      {chapter.missingSections.map((sec, i) => (
        <MissingSection key={i} text={sec} />
      ))}
    </div>
  )
}

export default function AutobiographyScreen() {
  const navigate = useNavigate()
  const { chapters } = useAutobiographyStore()
  const { userName } = useAuthStore()

  const [activeIdx, setActiveIdx] = useState(0)
  const [showToast, setShowToast] = useState(false)

  const TAB_LABELS = useMemo(
    () =>
      chapters.length > 0
        ? chapters.map((ch, i) => ({ id: ch.chapterId, label: `${i + 1}장`, title: ch.chapterTitle }))
        : [{ id: 'empty', label: '1장', title: '아직 생성되지 않음' }],
    [chapters]
  )

  const activeChapter = chapters[activeIdx]

  const pdfDocument = useMemo(
    () =>
      chapters.length > 0 ? (
        <AutobiographyPDF
          userName={userName || '이름 미설정'}
          chapters={chapters}
          createdAt={today}
        />
      ) : null,
    [chapters, userName]
  )

  const [pdfInstance] = usePDF(
    pdfDocument ? { document: pdfDocument } : {}
  )

  const handleDownload = () => {
    if (!pdfInstance.loading && pdfInstance.url) {
      setTimeout(() => {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 1000)
      }, 200)
    }
  }

  const canDownload = !pdfInstance.loading && !!pdfInstance.url && chapters.length > 0
  const fileName = `dearlog_자서전_${userName || '이름없음'}.pdf`

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3EA]">
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
          <BackArrow />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#3E3128]">자서전 초안</h1>
          <p className="text-[12px] text-[#7A6A5C]">AI가 정리한 이야기 초안입니다</p>
        </div>
      </div>

      {/* Chapter tabs */}
      <div className="px-5 mb-4">
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ backgroundColor: '#FFFDF8', boxShadow: '0 2px 8px rgba(139,94,60,0.07)' }}
        >
          {TAB_LABELS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveIdx(i)}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium transition-all active:opacity-70"
              style={{
                backgroundColor: activeIdx === i ? '#C8956C' : 'transparent',
                color: activeIdx === i ? '#FFFDF8' : '#7A6A5C',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter title */}
      {activeChapter && (
        <div className="px-5 mb-4">
          <h2 className="text-[17px] font-bold text-[#3E3128]">{activeChapter.chapterTitle}</h2>
          <p className="text-[13px] text-[#7A6A5C] mt-0.5">
            {activeChapter.paragraphs.length}개 문단 ·{' '}
            {activeChapter.missingSections.length > 0
              ? `${activeChapter.missingSections.length}개 미작성 구간`
              : '구간 완성'}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28 px-5">
        {activeChapter ? <ChapterView chapter={activeChapter} /> : <EmptyChapter />}
      </div>

      {/* PDF export */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-8 pt-4"
        style={{ backgroundColor: '#F8F3EA' }}
      >
        {canDownload ? (
          <a
            href={pdfInstance.url!}
            download={fileName}
            onClick={handleDownload}
            className="flex items-center justify-center w-full h-14 rounded-2xl text-[16px] font-bold active:opacity-70"
            style={{
              backgroundColor: '#C8956C',
              color: '#FFFDF8',
              textDecoration: 'none',
            }}
          >
            PDF로 내보내기
          </a>
        ) : (
          <button
            disabled
            className="w-full h-14 rounded-2xl text-[16px] font-bold"
            style={{
              backgroundColor: '#C8956C',
              color: '#FFFDF8',
              opacity: 0.5,
            }}
          >
            {pdfInstance.loading && chapters.length > 0 ? '생성 중...' : 'PDF로 내보내기 (준비 중)'}
          </button>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-[14px] font-bold text-white"
          style={{
            backgroundColor: '#6B8F71',
            boxShadow: '0 4px 20px rgba(107,143,113,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          저장됐어요 ✓
        </div>
      )}
    </div>
  )
}
