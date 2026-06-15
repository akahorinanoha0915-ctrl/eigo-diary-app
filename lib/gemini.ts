import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export type VocabWord = { word: string; meaning_ja: string; example: string }

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

export async function getAIComment(diaryContent: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `あなたは小学生の英語日記に返事をする優しい外国人の先生「Ms. Sunny」です。
以下のルールで返事を書いてください：
- 間違いを直接指摘しない（書く意欲を守る）
- 書いてくれたことを明るく褒める
- さりげなく正しい英語を自然に使って返す
- 返事は英語2文＋最後に日本語で一言（20文字以内）
- 絵文字を1〜2個使って親しみやすく

児童の日記：
${diaryContent}`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
