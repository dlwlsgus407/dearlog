import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { GhostwriterResult } from '../types/agents'

Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/KR/NotoSansKR-Bold.otf',
      fontWeight: 700,
    },
  ],
})

Font.registerHyphenationCallback((word) => [word])

type ReliabilityLabel = 'CONFIRMED' | 'ESTIMATED' | 'UNVERIFIED'

const RELIABILITY_BG: Record<ReliabilityLabel, string> = {
  CONFIRMED: '#6B8F71',
  ESTIMATED: '#C8956C',
  UNVERIFIED: '#7A6A5C',
}
const RELIABILITY_KO: Record<ReliabilityLabel, string> = {
  CONFIRMED: '확인됨',
  ESTIMATED: '추정됨',
  UNVERIFIED: '미검증',
}

const s = StyleSheet.create({
  // Cover
  coverPage: {
    backgroundColor: '#F8F3EA',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
    paddingLeft: 60,
    paddingRight: 60,
  },
  coverAccent: { width: 56, height: 5, backgroundColor: '#C8956C', marginBottom: 52 },
  coverTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: 700,
    fontSize: 34,
    color: '#3E3128',
    textAlign: 'center',
    marginBottom: 22,
  },
  coverName: {
    fontFamily: 'NotoSansKR',
    fontSize: 18,
    color: '#7A6A5C',
    textAlign: 'center',
    marginBottom: 10,
  },
  coverDate: {
    fontFamily: 'NotoSansKR',
    fontSize: 12,
    color: '#7A6A5C',
    textAlign: 'center',
  },
  coverDivider: { width: 56, height: 1, backgroundColor: '#EBC7A6', marginTop: 48, marginBottom: 22 },
  coverBrand: {
    fontFamily: 'NotoSansKR',
    fontWeight: 700,
    fontSize: 14,
    color: '#8B5E3C',
    textAlign: 'center',
  },

  // Content pages
  page: {
    backgroundColor: '#FFFDF8',
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 64,
    paddingRight: 64,
  },
  chapterNum: {
    fontFamily: 'NotoSansKR',
    fontSize: 11,
    color: '#C8956C',
    marginBottom: 6,
    letterSpacing: 1,
  },
  chapterTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: 700,
    fontSize: 22,
    color: '#3E3128',
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#EBC7A6',
    borderBottomStyle: 'solid',
    marginBottom: 28,
  },

  // Paragraph
  para: { marginBottom: 22 },
  paraText: {
    fontFamily: 'NotoSansKR',
    fontSize: 11,
    color: '#3E3128',
    lineHeight: 1.9,
  },
  paraTextMuted: {
    fontFamily: 'NotoSansKR',
    fontSize: 11,
    color: '#9A8878',
    lineHeight: 1.9,
  },
  uncertaintyNote: {
    fontFamily: 'NotoSansKR',
    fontSize: 9,
    color: '#7A6A5C',
    marginTop: 5,
    fontStyle: 'italic',
  },
  badgeRow: { flexDirection: 'row', gap: 4, marginTop: 7 },
  badge: {
    borderRadius: 3,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
  },
  badgeText: { fontFamily: 'NotoSansKR', fontSize: 8, color: '#FFFDF8' },

  // Missing section
  missingBox: {
    borderWidth: 1,
    borderColor: '#D0C8BE',
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    marginBottom: 14,
  },
  missingText: { fontFamily: 'NotoSansKR', fontSize: 10, color: '#7A6A5C' },

  // Page number
  pageNum: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'NotoSansKR',
    fontSize: 9,
    color: '#7A6A5C',
  },
})

interface Props {
  userName: string
  chapters: GhostwriterResult[]
  createdAt: string
}

export function AutobiographyPDF({ userName, chapters, createdAt }: Props) {
  return (
    <Document
      title={`${userName}의 자서전`}
      author="Dearlog"
      subject="가족 자서전 · Dearlog"
    >
      {/* ── Cover ── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverAccent} />
        <Text style={s.coverTitle}>기억의 이야기</Text>
        <Text style={s.coverName}>{userName || '이름 미설정'}</Text>
        <Text style={s.coverDate}>{createdAt} 생성</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverBrand}>Dearlog</Text>
      </Page>

      {/* ── Chapter pages ── */}
      {chapters.map((ch, idx) => (
        <Page key={ch.chapterId} size="A4" style={s.page}>
          <Text style={s.chapterNum}>{idx + 1}장</Text>
          <Text style={s.chapterTitle}>{ch.chapterTitle}</Text>

          {ch.paragraphs.map((para) => (
            <View key={para.paragraphId} style={s.para}>
              <Text
                style={
                  para.reliability === 'UNVERIFIED' ? s.paraTextMuted : s.paraText
                }
              >
                {para.text}
              </Text>

              {para.uncertaintyNote ? (
                <Text style={s.uncertaintyNote}>※ {para.uncertaintyNote}</Text>
              ) : null}

              <View style={s.badgeRow}>
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor:
                        RELIABILITY_BG[para.reliability as ReliabilityLabel] ?? '#7A6A5C',
                    },
                  ]}
                >
                  <Text style={s.badgeText}>
                    {RELIABILITY_KO[para.reliability as ReliabilityLabel] ?? para.reliability}
                  </Text>
                </View>
                {para.sourceChunkIds.length > 0 && (
                  <View style={[s.badge, { backgroundColor: '#8B5E3C' }]}>
                    <Text style={s.badgeText}>기억 {para.sourceChunkIds.length}개</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {ch.missingSections.map((sec, i) => (
            <View key={i} style={s.missingBox}>
              <Text style={s.missingText}>✏ {sec}</Text>
            </View>
          ))}

          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </Page>
      ))}
    </Document>
  )
}
