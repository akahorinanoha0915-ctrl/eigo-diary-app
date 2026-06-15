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

  const prompt = `あなたは小学5〜6年生向けの英語の先生「Ms. Sunny」です。
児童が書いた英語日記に返事を書いてください。

以下のJSONのみ返してください（他のテキスト不要）：
{
  "comment": "英語で2〜3文（中学生以下でも分かる簡単な単語のみ）＋絵文字1〜2個＋最後に日本語で一言（15文字以内）",
  "grammarNote": "文法や単語のミスがあれば「○○は〜と書くともっとよいよ！」と日本語で優しく一言。なければnull",
  "todayWord": {"word":"次回使ってみてほしい英単語","meaning_ja":"日本語の意味","example":"短くて簡単な例文"}
}

ルール：
- comment は簡単な英語（I, like, today, went, fun, good など基本単語中心）
- 間違いを責めず、grammarNote で正しい形をやさしく教える
- todayWord は日記の内容に関連した、覚えやすい単語1つ

児童の日記：${diaryContent}`

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
