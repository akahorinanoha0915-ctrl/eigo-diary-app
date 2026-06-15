import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)


export type VocabWord = { word: string; meaning_ja: string; example: string }
export type AIResponse = {
  comment: string
  grammarNote: string | null
  todayWord: VocabWord
}

export async function getAIResponse(diaryContent: string): Promise<AIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are Ms. Sunny, a friendly English teacher for Japanese elementary school students (grade 5-6).
Reply to this student's diary entry. Return ONLY this JSON (no other text):
{"comment":"2-3 simple English sentences + 1-2 emoji + one Japanese sentence under 15 chars","grammarNote":"If grammar mistake exists: explain gently in Japanese like 'XXはYYと書くともっとよいよ！'. Otherwise null","todayWord":{"word":"one useful English word","meaning_ja":"Japanese meaning","example":"short simple example"}}

Rules: use only basic words (go, play, eat, fun, happy, etc). Be encouraging.

Diary: ${diaryContent}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    const parsed = JSON.parse(match[0])
    return {
      comment: parsed.comment || '',
      grammarNote: parsed.grammarNote || null,
      todayWord: parsed.todayWord || { word: '', meaning_ja: '', example: '' },
    }
  }
  return {
    comment: 'Great diary! Keep writing! 🌟\nよく書けました！',
    grammarNote: null,
    todayWord: { word: 'wonderful', meaning_ja: '素晴らしい', example: 'It was wonderful!' },
  }
}

export async function extractVocabulary(diaryContent: string): Promise<VocabWord[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = `以下の小学生の英語日記から、学習価値のある英単語・フレーズを2〜3個抽出してください。
JSON配列のみを返してください（他のテキスト不要）：
[{"word":"英単語","meaning_ja":"日本語の意味","example":"日記内での自然な例文"}]

日記：${diaryContent}`
  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return []
}
